import os

# Create the watchlist page
page = '''"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = [
  { label: "Requests", href: "/admin" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Sales", href: "/sales" },
  { label: "Customers", href: "/customers" },
  { label: "Inventory", href: "/inventory" },
  { label: "Expenses", href: "/expenses" },
  { label: "Analytics", href: "/analytics" },
  { label: "Reminders", href: "/reminders" },
  { label: "Watchlist", href: "/watchlist", active: true },
  { label: "Settings", href: "/settings" },
];

export default function WatchlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ part_name: "", make: "", notes: "", priority: "Normal" });
  const [topParts, setTopParts] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      fetchData();
    });
  }, []);

  async function fetchData() {
    const [{ data: w }, { data: r }] = await Promise.all([
      supabase.from("part_watchlist").select("*").order("created_at", { ascending: false }),
      supabase.from("parts_requests").select("part_needed").order("created_at", { ascending: false }).limit(200),
    ]);
    setItems(w || []);

    // Calculate most requested parts not yet on watchlist
    const counts: Record<string, number> = {};
    (r || []).forEach((req: any) => {
      const p = (req.part_needed || "").toLowerCase().trim();
      if (p) counts[p] = (counts[p] || 0) + 1;
    });
    const watchedParts = (w || []).map((i: any) => i.part_name.toLowerCase());
    const top = Object.entries(counts)
      .filter(([p]) => !watchedParts.includes(p))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([part, count]) => ({ part, count }));
    setTopParts(top);
    setLoading(false);
  }

  async function saveItem() {
    if (!form.part_name.trim()) { alert("Enter a part name"); return; }
    setSaving(true);
    if (modal?.id) {
      await supabase.from("part_watchlist").update({ ...form }).eq("id", modal.id);
    } else {
      await supabase.from("part_watchlist").insert([{ ...form }]);
    }
    setSaving(false);
    setModal(null);
    setForm({ part_name: "", make: "", notes: "", priority: "Normal" });
    fetchData();
  }

  async function markFound(id: number) {
    await supabase.from("part_watchlist").update({ status: "Found", found_at: new Date().toISOString() }).eq("id", id);
    fetchData();
  }

  async function deleteItem(id: number) {
    if (!confirm("Remove from watchlist?")) return;
    await supabase.from("part_watchlist").delete().eq("id", id);
    fetchData();
  }

  const watching = items.filter(i => i.status === "Watching");
  const found = items.filter(i => i.status === "Found");

  const priorityColor = (p: string) => p === "Urgent" ? "#f87171" : p === "High" ? "#fb923c" : p === "Normal" ? "#60a5fa" : "#9ca3af";

  return (
    <main style={{ minHeight: "100vh", background: "#0e0e0e", color: "white" }}>
      {/* NAV */}
      <header style={{ background: "rgba(0,0,0,0.8)", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
            {NAV_LINKS.map(l => (
              <button key={l.href} onClick={() => router.push(l.href)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap cursor-pointer transition flex-shrink-0"
                style={{ background: l.active ? "rgba(249,115,22,0.15)" : "transparent", color: l.active ? "#f97316" : "rgba(255,255,255,0.5)", border: l.active ? "1px solid rgba(249,115,22,0.2)" : "1px solid transparent" }}>
                {l.label}{l.label === "Watchlist" && watching.length > 0 ? ` (${watching.length})` : ""}
              </button>
            ))}
          </div>
          <button onClick={() => { setModal({}); setForm({ part_name: "", make: "", notes: "", priority: "Normal" }); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold cursor-pointer flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", border: "none" }}>
            + Add Part
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* AI SUGGESTIONS from request history */}
        {topParts.length > 0 && (
          <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
            <p className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: "#a78bfa" }}>Suggested from your request history</p>
            <div className="flex flex-wrap gap-2">
              {topParts.map(({ part, count }) => (
                <button key={part} onClick={() => { setModal({}); setForm({ part_name: part, make: "", notes: "", priority: count >= 5 ? "High" : "Normal" }); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                  {part} <span className="text-[10px] opacity-60">({count}x)</span> +
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Watching", value: watching.length, color: "#60a5fa" },
            { label: "Found", value: found.length, color: "#4ade80" },
            { label: "Urgent", value: items.filter(i => i.priority === "Urgent" && i.status === "Watching").length, color: "#f87171" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</p>
              <p className="text-[28px] font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* WATCHING LIST */}
        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading...</div>
        ) : watching.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[32px] mb-3">👁</p>
            <p className="font-bold text-white text-[16px] mb-2">No parts on watchlist</p>
            <p className="text-gray-500 text-[13px] mb-4">Add parts you frequently get asked for so you can proactively source them</p>
            <button onClick={() => { setModal({}); setForm({ part_name: "", make: "", notes: "", priority: "Normal" }); }}
              className="px-6 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer"
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", border: "none" }}>
              Add First Part
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <h2 className="font-bold text-[15px] text-white mb-3">Currently Watching</h2>
            {watching.sort((a, b) => {
              const pOrder: Record<string, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
              return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
            }).map(item => (
              <div key={item.id} className="rounded-2xl p-4 flex items-start justify-between gap-3"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${item.priority === "Urgent" ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.07)"}` }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[15px] text-white">{item.part_name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${priorityColor(item.priority)}20`, color: priorityColor(item.priority) }}>{item.priority}</span>
                  </div>
                  {item.make && <p className="text-[12px] text-gray-500 mb-1">{item.make}</p>}
                  {item.notes && <p className="text-[12px] text-gray-600">{item.notes}</p>}
                  <p className="text-[11px] text-gray-700 mt-1">Added {new Date(item.created_at).toLocaleDateString("en-ZA")}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => markFound(item.id)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
                    style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
                    Found
                  </button>
                  <button onClick={() => { setModal(item); setForm({ part_name: item.part_name, make: item.make || "", notes: item.notes || "", priority: item.priority }); }}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                    Edit
                  </button>
                  <button onClick={() => deleteItem(item.id)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer"
                    style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", color: "#f87171" }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FOUND LIST */}
        {found.length > 0 && (
          <div>
            <h2 className="font-bold text-[15px] text-white mb-3">Found</h2>
            <div className="space-y-2">
              {found.map(item => (
                <div key={item.id} className="rounded-xl p-3 flex items-center justify-between"
                  style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.1)" }}>
                  <div>
                    <span className="font-semibold text-[13px] text-white">{item.part_name}</span>
                    {item.make && <span className="text-[12px] text-gray-500 ml-2">{item.make}</span>}
                    {item.found_at && <span className="text-[11px] text-gray-600 ml-2">Found {new Date(item.found_at).toLocaleDateString("en-ZA")}</span>}
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="text-gray-700 text-[11px] cursor-pointer" style={{ background: "none", border: "none" }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {modal !== null && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">{modal.id ? "Edit Part" : "Add to Watchlist"}</h2>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Part Name *</label>
                <input value={form.part_name} onChange={e => setForm(p => ({ ...p, part_name: e.target.value }))}
                  placeholder="e.g. Rear Brake Pads"
                  className="w-full rounded-xl px-3 py-3 text-[14px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.07)", border: "2px solid rgba(249,115,22,0.3)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Vehicle Make (optional)</label>
                <input value={form.make} onChange={e => setForm(p => ({ ...p, make: e.target.value }))}
                  placeholder="e.g. VW Golf, Toyota"
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Priority</label>
                <div className="flex gap-2">
                  {["Low", "Normal", "High", "Urgent"].map(p => (
                    <button key={p} onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                      className="flex-1 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                      style={form.priority === p
                        ? { background: `${priorityColor(p)}20`, border: `1px solid ${priorityColor(p)}`, color: priorityColor(p) }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Customer needs OEM only, common on 2018-2020 models"
                  rows={2} className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveItem} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-[13px] font-semibold cursor-pointer text-white"
                  style={{ background: saving ? "rgba(249,115,22,0.4)" : "linear-gradient(135deg,#f97316,#ea580c)", border: "none" }}>
                  {saving ? "Saving..." : modal.id ? "Save Changes" : "Add to Watchlist"}
                </button>
                <button onClick={() => setModal(null)}
                  className="px-5 py-3 rounded-xl text-[13px] font-medium cursor-pointer"
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
'''
os.makedirs("frontend/app/watchlist", exist_ok=True)
open("frontend/app/watchlist/page.tsx", "w", encoding="utf-8").write(page)
print("Created watchlist page!")

# Add Watchlist to admin nav
for nav_file in ["frontend/app/admin/page.tsx"]:
    c = open(nav_file, encoding="utf-8").read()
    old = '{ label: "Reviews", href: "/reviews-admin" },'
    new = '{ label: "Reviews", href: "/reviews-admin" },\n  { label: "Watchlist", href: "/watchlist" },'
    if old in c and "watchlist" not in c:
        c = c.replace(old, new, 1)
        open(nav_file, "w", encoding="utf-8").write(c)
        print(f"Added Watchlist to {nav_file} nav!")

print("All done!")
