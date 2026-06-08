path = r"frontend/app/quotes/[id]/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add rejectModal state
old_state = '  const [confirmModal, setConfirmModal] = useState<any>(null);'
new_state = '''  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);'''
c = c.replace(old_state, new_state, 1)

# 2. Add rejectQuote function before printQuote
old_fn = '  async function getNextNumber'
new_fn = '''  async function rejectQuote() {
    if (!rejectModal) return;
    setRejecting(true);
    await supabase.from("supplier_quotes").update({
      notes: (rejectModal.notes ? rejectModal.notes + " | " : "") + "REJECTED: " + (rejectReason || "No reason given"),
      rejected: true,
    }).eq("id", rejectModal.id);
    setRejecting(false);
    setRejectModal(null);
    setRejectReason("");
    fetchData();
  }

  async function getNextNumber'''
c = c.replace(old_fn, new_fn, 1)

# 3. Add Reject button after Edit Price button
old_btn = '''                    <button o'''  
# Find the specific delete button area
old_delete = '''                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                      Delete
                    <'''
new_delete = '''                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                      Delete
                    <'''

# Add reject button before delete
old_buttons = '''                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                      Delete'''
new_buttons = '''                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                      Delete'''

# Find delete button and add reject before it
old_area = '                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>\n                      Delete'
new_area = '''                      style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", color: "#fca5a5" }}>\n                      Delete'''

# Actually let's find the exact reject insertion point
old_reject_spot = 'style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>\n                      Delete'
new_reject_spot = '''style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>\n                      Delete'''

# Find the exact location after Edit Price
i = c.find('Edit Price\n                    </button>')
j = c.find('Delete\n                    <', i)
if i > 0 and j > 0:
    # Find the full delete button start
    k = c.rfind('<button', 0, j)
    reject_btn = '''
                    {!quote.rejected && !quote.sale_id && (
                      <button onClick={() => { setRejectModal(quote); setRejectReason(""); }}
                        className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                        Reject
                      </button>
                    )}
                    {quote.rejected && (
                      <span className="px-3 py-2 rounded-lg text-[12px] font-medium"
                        style={{ background: "rgba(239,68,68,0.06)", color: "#f87171" }}>
                        Rejected
                      </span>
                    )}'''
    c = c[:k] + reject_btn + "\n" + c[k:]
    print("Added reject button!")
else:
    print("Could not find insertion point", i, j)

# 4. Add visual indicator for rejected quotes
old_card = 'style={{ background: isStale ? "rgba(239,68,68,0.03)" : "rgba(255,255,255,0.03)", border: isStale ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.08)"'
new_card = 'style={{ background: quote.rejected ? "rgba(107,114,128,0.05)" : isStale ? "rgba(239,68,68,0.03)" : "rgba(255,255,255,0.03)", border: quote.rejected ? "1px solid rgba(107,114,128,0.15)" : isStale ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.08)", opacity: quote.rejected ? 0.7 : 1'
c = c.replace(old_card, new_card, 1)

# 5. Add reject modal before closing main
old_closing = '\n    </main>\n  );\n}'
new_closing = '''
      {/* REJECT MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setRejectModal(null); }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Reject Quote</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Mark this quote as rejected — customer said no or price too high</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Reason (optional)</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {["Price too high", "Found elsewhere", "No longer needed", "No response"].map(r => (
                    <button key={r} onClick={() => setRejectReason(r)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition"
                      style={rejectReason === r
                        ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                      {r}
                    </button>
                  ))}
                </div>
                <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Or type a custom reason..."
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={rejectQuote} disabled={rejecting}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: rejecting ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.8)", border: "none" }}>
                  {rejecting ? "Rejecting..." : "Confirm Reject"}
                </button>
                <button onClick={() => setRejectModal(null)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}'''
c = c.replace(old_closing, new_closing, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has rejectModal:", "rejectModal" in c)
print("has rejectQuote:", "rejectQuote" in c)
