path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add quickSale state
old_state = '  const [editModal, setEditModal] = useState<any>(null);'
new_state = '''  const [editModal, setEditModal] = useState<any>(null);
  const [quickSaleModal, setQuickSaleModal] = useState<any>(null);
  const [quickSalePrice, setQuickSalePrice] = useState("");
  const [quickSaleCost, setQuickSaleCost] = useState("");
  const [savingQuickSale, setSavingQuickSale] = useState(false);'''
c = c.replace(old_state, new_state, 1)

# 2. Add quickSale function before NAV_LINKS
old_nav = '  const NAV_LINKS = ['
new_nav = '''  async function saveQuickSale() {
    if (!quickSaleModal || !quickSalePrice) { alert("Please enter a selling price"); return; }
    setSavingQuickSale(true);
    const selling = parseFloat(quickSalePrice);
    const cost = parseFloat(quickSaleCost) || 0;
    const profit = selling - cost;
    const { error } = await supabase.from("sales").insert([{
      request_id: quickSaleModal.id,
      customer_name: quickSaleModal.customer_name,
      customer_phone: quickSaleModal.phone_number,
      part_needed: quickSaleModal.part_needed,
      selling_price: selling,
      supplier_price: cost,
      profit: profit,
      status: "Completed",
    }]);
    if (error) { alert("Failed to save sale"); setSavingQuickSale(false); return; }
    await supabase.from("parts_requests").update({ status: "Delivered" }).eq("id", quickSaleModal.id);
    setSavingQuickSale(false);
    setQuickSaleModal(null);
    setQuickSalePrice("");
    setQuickSaleCost("");
    fetchRequests();
    setTimeout(() => setReviewModal(quickSaleModal), 800);
  }

  const NAV_LINKS = ['''
c = c.replace(old_nav, new_nav, 1)

# 3. Add Quick Sale button after View Quotes button
old_view_quotes = '''                        <button onClick={() => router.push(`/quotes/${request.id}`)}
                          className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                          View Quotes
                        </button>'''
new_view_quotes = '''                        <button onClick={() => router.push(`/quotes/${request.id}`)}
                          className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                          View Quotes
                        </button>
                        <button onClick={() => { setQuickSaleModal(request); setQuickSalePrice(""); setQuickSaleCost(""); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>
                          Quick Sale
                        </button>'''
c = c.replace(old_view_quotes, new_view_quotes, 1)

# 4. Add quick sale modal before closing main
old_closing = '\n    </main>\n  );\n}'
new_closing = '''
      {/* QUICK SALE MODAL */}
      {quickSaleModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setQuickSaleModal(null); }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Quick Sale</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{quickSaleModal.customer_name} · {quickSaleModal.part_needed}</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Selling Price (R) *</label>
                <input type="text" inputMode="decimal" placeholder="What customer pays"
                  value={quickSalePrice} onChange={e => setQuickSalePrice(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full rounded-xl px-3 py-3 text-[15px] font-semibold outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.07)", border: "2px solid rgba(34,197,94,0.3)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Your Cost (R) — optional</label>
                <input type="text" inputMode="decimal" placeholder="What you paid supplier"
                  value={quickSaleCost} onChange={e => setQuickSaleCost(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="w-full rounded-xl px-3 py-3 text-[14px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              {quickSalePrice && parseFloat(quickSalePrice) > 0 && (
                <div className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-400">Profit</span>
                    <span className="font-bold" style={{ color: "#4ade80" }}>
                      R{(parseFloat(quickSalePrice) - (parseFloat(quickSaleCost) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-[11px] text-gray-600">This will mark the request as Delivered and save to Sales.</p>
              <div className="flex gap-2 pt-1" style={{ position: "sticky", bottom: 0, background: "#1a1a1a", paddingTop: 8 }}>
                <button onClick={saveQuickSale} disabled={savingQuickSale || !quickSalePrice}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: savingQuickSale || !quickSalePrice ? "rgba(34,197,94,0.3)" : "linear-gradient(135deg,#22c55e,#16a34a)", border: "none" }}>
                  {savingQuickSale ? "Saving..." : "Save Sale"}
                </button>
                <button onClick={() => setQuickSaleModal(null)}
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
print("has quickSaleModal:", "quickSaleModal" in c)
print("has saveQuickSale:", "saveQuickSale" in c)
print("has Quick Sale button:", "Quick Sale" in c)
