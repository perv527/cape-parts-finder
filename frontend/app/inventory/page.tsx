"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["All", "Engine", "Brakes", "Suspension", "Electrical", "Body", "Transmission", "Cooling", "Exhaust", "Tyres", "Other"];

const darkBg = { minHeight: "100vh", background: "#0e0e0e", color: "white" };
const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showLowStock, setShowLowStock] = useState(false);
  const [modal, setModal] = useState<any>(null); // null | "add" | item (edit)
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [form, setForm] = useState({
    part_name: "", part_number: "", category: "Engine",
    quantity: "", min_quantity: "1", supplier_id: "",
    cost_price: "", selling_price: "", location: "", notes: "",
  });

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
      await supabase.auth.refreshSession();
    fetchData();
  }

  async function fetchData() {
    setLoading(true);
    const [{ data: inv }, { data: sup }] = await Promise.all([
      supabase.from("inventory").select("*, suppliers(name)").order("part_name"),
      supabase.from("suppliers").select("id, name").eq("active", true).order("name"),
    ]);
    setItems(inv || []);
    setSuppliers(sup || []);
    setLoading(false);
  }

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || (i.part_name||"").toLowerCase().includes(q) || (i.part_number||"").toLowerCase().includes(q) || (i.category||"").toLowerCase().includes(q);
    const matchCat = categoryFilter === "All" || i.category === categoryFilter;
    const matchLow = !showLowStock || i.quantity <= i.min_quantity;
    return matchSearch && matchCat && matchLow;
  });

  const lowStockCount = items.filter(i => i.quantity <= i.min_quantity).length;
  const totalValue = items.reduce((sum, i) => sum + (Number(i.cost_price) * Number(i.quantity)), 0);
  const totalItems = items.reduce((sum, i) => sum + Number(i.quantity), 0);

  function openAdd() {
    setForm({ part_name: "", part_number: "", category: "Engine", quantity: "", min_quantity: "1", supplier_id: "", cost_price: "", selling_price: "", location: "", notes: "" });
    setModal("add");
  }

  function openEdit(item: any) {
    setForm({
      part_name: item.part_name || "", part_number: item.part_number || "",
      category: item.category || "Engine", quantity: String(item.quantity ?? ""),
      min_quantity: String(item.min_quantity ?? 1), supplier_id: item.supplier_id ? String(item.supplier_id) : "",
      cost_price: item.cost_price ? String(item.cost_price) : "",
      selling_price: item.selling_price ? String(item.selling_price) : "",
      location: item.location || "", notes: item.notes || "",
    });
    setModal(item);
  }

  async function saveItem() {
    if (!form.part_name.trim()) { alert("Part name is required"); return; }
    setSaving(true);
    const payload = {
      part_name: form.part_name.trim(),
      part_number: form.part_number.trim() || null,
      category: form.category,
      quantity: parseInt(form.quantity) || 0,
      min_quantity: parseInt(form.min_quantity) || 1,
      supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (modal === "add") {
      await supabase.from("inventory").insert([payload]);
    } else {
      await supabase.from("inventory").update(payload).eq("id", modal.id);
    }
    setSaving(false);
    setModal(null);
    fetchData();
  }

  async function adjustQty(id: number, delta: number) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    await supabase.from("inventory").update({ quantity: newQty, updated_at: new Date().toISOString() }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: newQty } : i));
  }

  async function deleteItem(id: number) {
    await supabase.from("inventory").delete().eq("id", id);
    setDeleteConfirm(null);
    fetchData();
  }

  const isLow = (item: any) => item.quantity <= item.min_quantity;
  const isOut = (item: any) => item.quantity === 0;

  const inputStyle: React.CSSProperties = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", padding: "8px 12px", width: "100%", outline: "none", fontSize: 13 };

  if (loading) return (
    <main style={darkBg} className="flex items-center justify-center">
      <div className="flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 20px" }}>
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <p className="text-gray-300 text-sm">Loading inventory...</p>
      </div>
    </main>
  );

  return (
    <main style={darkBg}>
      {/* NAV */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <span className="font-bold text-white text-[14px] hidden sm:block">Cape Parts Finder</span>
          </div>
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide flex-1 mx-1">
            {[{ label: "Requests", href: "/admin" }, { label: "Suppliers", href: "/suppliers" }, { label: "Sales", href: "/sales" }, { label: "Customers", href: "/customers" }, { label: "Inventory", href: "/inventory", active: true }, { label: "Expenses", href: "/expenses" }, { label: "Analytics", href: "/analytics" }].map((n) => (
              <a key={n.href} href={n.href} className="px-3 py-1.5 rounded-lg text-[12px] no-underline transition font-medium whitespace-nowrap flex-shrink-0"
                style={n.active ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" } : { color: "rgba(255,255,255,0.4)", border: "1px solid transparent" }}>
                {n.label}
              </a>
            ))}
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer transition flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", border: "none" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="hidden sm:block">Add Part</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">
        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Parts", value: items.length, color: "#fb923c" },
            { label: "Total Stock", value: totalItems + " units", color: "#60a5fa" },
            { label: "Low / Out", value: lowStockCount, color: lowStockCount > 0 ? "#f87171" : "#4ade80" },
            { label: "Stock Value", value: "R" + totalValue.toFixed(0), color: "#4ade80" },
          ].map(s => (
            <div key={s.label} style={cardStyle} className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</div>
              <div className="text-[20px] font-black" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div style={cardStyle} className="p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <input
              type="text" placeholder="Search part name, number or category..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 rounded-xl px-4 py-2.5 text-[13px] outline-none text-white placeholder-gray-600"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            <button onClick={() => setShowLowStock(!showLowStock)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-medium cursor-pointer transition whitespace-nowrap"
              style={showLowStock
                ? { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }
                : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
              ⚠ {lowStockCount > 0 ? `${lowStockCount} low stock` : "Low stock"}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className="px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer transition whitespace-nowrap flex-shrink-0"
                style={categoryFilter === cat
                  ? { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c" }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ITEMS */}
        {filtered.length === 0 ? (
          <div style={cardStyle} className="p-12 text-center">
            <div className="text-4xl mb-3">📦</div>
            <div className="text-white font-semibold mb-1">{items.length === 0 ? "No parts yet" : "No results"}</div>
            <div className="text-gray-500 text-[13px]">{items.length === 0 ? "Click \"Add Part\" to start tracking inventory" : "Try a different search or filter"}</div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => (
              <div key={item.id} style={{
                ...cardStyle,
                border: isOut(item) ? "1px solid rgba(239,68,68,0.35)" : isLow(item) ? "1px solid rgba(251,146,60,0.3)" : "1px solid rgba(255,255,255,0.07)",
                background: isOut(item) ? "rgba(239,68,68,0.04)" : isLow(item) ? "rgba(249,115,22,0.04)" : "rgba(255,255,255,0.03)",
              }} className="p-4">
                <div className="flex items-start gap-3">
                  {/* Left */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-white text-[14px] truncate">{item.part_name}</span>
                      {item.part_number && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                          #{item.part_number}
                        </span>
                      )}
                      {isOut(item) && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>OUT OF STOCK</span>}
                      {!isOut(item) && isLow(item) && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}>LOW STOCK</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {item.category && <span>📁 {item.category}</span>}
                      {item.suppliers?.name && <span>🏭 {item.suppliers.name}</span>}
                      {item.location && <span>📍 {item.location}</span>}
                      {item.cost_price && <span>Cost: R{Number(item.cost_price).toFixed(2)}</span>}
                      {item.selling_price && <span style={{ color: "#4ade80" }}>Sell: R{Number(item.selling_price).toFixed(2)}</span>}
                    </div>
                    {item.notes && <div className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>{item.notes}</div>}
                  </div>

                  {/* Right - qty controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <button onClick={() => adjustQty(item.id, -1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition font-bold text-[16px]"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>−</button>
                      <div className="w-10 text-center">
                        <div className="font-black text-[18px]" style={{ color: isOut(item) ? "#f87171" : isLow(item) ? "#fb923c" : "white" }}>{item.quantity}</div>
                        <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>min {item.min_quantity}</div>
                      </div>
                      <button onClick={() => adjustQty(item.id, 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition font-bold text-[16px]"
                        style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>+</button>
                    </div>
                    <button onClick={() => openEdit(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => setDeleteConfirm(item)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition"
                      style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {modal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">{modal === "add" ? "Add Part" : "Edit Part"}</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{modal === "add" ? "Add a new part to inventory" : `Editing: ${modal.part_name}`}</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] text-gray-500 mb-1 block">Part Name *</label>
                  <input style={inputStyle} placeholder="e.g. Brake Pad Set" value={form.part_name} onChange={e => setForm(f => ({ ...f, part_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Part Number</label>
                  <input style={inputStyle} placeholder="e.g. BP-1234" value={form.part_number} onChange={e => setForm(f => ({ ...f, part_number: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Category</label>
                  <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c} style={{ background: "#1a1a1a" }}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Quantity in Stock</label>
                  <input style={inputStyle} type="number" min="0" placeholder="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Min Quantity (alert)</label>
                  <input style={inputStyle} type="number" min="0" placeholder="1" value={form.min_quantity} onChange={e => setForm(f => ({ ...f, min_quantity: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Cost Price (R)</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Selling Price (R)</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00" value={form.selling_price} onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Supplier</label>
                  <select style={inputStyle} value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}>
                    <option value="" style={{ background: "#1a1a1a" }}>No supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id} style={{ background: "#1a1a1a" }}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Storage Location</label>
                  <input style={inputStyle} placeholder="e.g. Shelf A3" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] text-gray-500 mb-1 block">Notes</label>
                  <textarea style={{ ...inputStyle, resize: "none", height: 60 }} placeholder="Any notes about this part..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={saveItem} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: saving ? "rgba(249,115,22,0.4)" : "linear-gradient(135deg,#f97316,#ea580c)", border: "none" }}>
                  {saving ? "Saving..." : modal === "add" ? "Add Part" : "Save Changes"}
                </button>
                <button onClick={() => setModal(null)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5">
              <h2 className="font-bold text-[15px] text-white mb-1">Delete Part?</h2>
              <p className="text-[13px] text-gray-400">This will permanently remove <span style={{ color: "#fb923c" }}>{deleteConfirm.part_name}</span> from inventory.</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => deleteItem(deleteConfirm.id)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: "rgba(239,68,68,0.8)", border: "none" }}>
                  Delete
                </button>
                <button onClick={() => setDeleteConfirm(null)}
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
}
