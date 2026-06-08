path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

# Add session warning state
old_state = '  const [reviewModal, setReviewModal] = useState<any>(null);'
new_state = '''  const [reviewModal, setReviewModal] = useState<any>(null);
  const [sessionWarning, setSessionWarning] = useState(false);'''
c = c.replace(old_state, new_state, 1)

# Add session warning check to auth listener
old_listener = '''    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
      }
    });'''
new_listener = '''    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
      }
      if (event === "TOKEN_REFRESHED") {
        setSessionWarning(false);
      }
    });

    // Warn 5 minutes before session expires
    const warningTimer = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const expiresAt = session.expires_at || 0;
        const minutesLeft = (expiresAt - Date.now() / 1000) / 60;
        if (minutesLeft < 5 && minutesLeft > 0) setSessionWarning(true);
        else setSessionWarning(false);
      }
    }, 60000);'''

old_return_cleanup = '    return () => subscription.unsubscribe();'
new_return_cleanup = '    return () => { subscription.unsubscribe(); clearInterval(warningTimer); };'

c = c.replace(old_listener, new_listener, 1)
c = c.replace(old_return_cleanup, new_return_cleanup, 1)

# Add session warning banner before </main>
old_closing = '\n    </main>\n  );\n}'
new_closing = '''
      {/* SESSION WARNING */}
      {sessionWarning && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "#1a1a1a", border: "1px solid rgba(251,191,36,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(251,191,36,0.15)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white mb-0.5">Session expiring soon</p>
            <p className="text-[12px] text-gray-400">Your session expires in less than 5 minutes.</p>
            <button onClick={async () => { await supabase.auth.refreshSession(); setSessionWarning(false); }}
              className="mt-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer"
              style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.25)", color: "#fbbf24" }}>
              Stay logged in
            </button>
          </div>
          <button onClick={() => setSessionWarning(false)} className="text-gray-600 cursor-pointer text-lg" style={{ background: "none", border: "none" }}>×</button>
        </div>
      )}
    </main>
  );
}'''
c = c.replace(old_closing, new_closing, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has sessionWarning:", "sessionWarning" in c)
print("has Stay logged in:", "Stay logged in" in c)
