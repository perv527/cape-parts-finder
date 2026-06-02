import re

# Fix 1 - overflow on suppliers and sales
for p in ["frontend/app/suppliers/page.tsx", "frontend/app/sales/page.tsx"]:
    c = open(p, encoding="utf-8").read()
    c = c.replace('overflowX: "hidden"', 'overflowX: "hidden" as const')
    # if no overflowX yet, add it to minHeight lines
    if 'overflowX' not in c:
        c = c.replace('minHeight: "100vh"', 'minHeight: "100vh", overflowX: "hidden" as const')
    open(p, "w", encoding="utf-8").write(c)
    print("overflow fixed:", p.split("/")[-2])

# Fix 2 - Admin: fix reminder modal overlap + confirmation modal overlap + add visible logout
path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

# Fix all modals - ensure they have proper z-index and overflow handling
# Replace all modal overlay divs to use proper mobile-safe styling
c = c.replace(
    'className="fixed inset-0 flex items-end sm:items-center justify-center"',
    'className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ zIndex: 200 }}',
)
# Some modals use items-center only
c = c.replace(
    'className="fixed inset-0 flex items-center justify-center p-4"',
    'className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 200 }}',
)

# Fix modal containers - ensure max-height and scroll on mobile
c = c.replace(
    'className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}',
    'className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto", overflowX: "hidden" }}',
)
c = c.replace(
    'className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}',
    'className="w-full max-w-sm rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto", overflowX: "hidden" }}',
)
c = c.replace(
    'className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}',
    'className="w-full max-w-md rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto", overflowX: "hidden" }}',
)

# Fix 3 - Add visible logout button to nav (replace the refresh button area)
old_nav_end = '''              <button onClick={fetchRequests} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>'''
new_nav_end = '''              <button onClick={fetchRequests} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
              <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}
                title="Logout">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>'''

c = c.replace(old_nav_end, new_nav_end, 1)

open(path, "w", encoding="utf-8").write(c)
print("admin fixed - logout + modals")
print("has logout button:", "Logout" in c)
print("has zIndex 200:", "zIndex: 200" in c)
