"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const STATUS_OPTIONS = ["New", "Searching", "Quoted", "Ordered", "Delivered", "Closed"];

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  New:       { bg: "rgba(249,115,22,0.12)", text: "#fb923c", dot: "#f97316", border: "rgba(249,115,22,0.25)" },
  Searching: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", dot: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  Quoted:    { bg: "rgba(34,197,94,0.12)",  text: "#4ade80", dot: "#22c55e", border: "rgba(34,197,94,0.25)" },
  Ordered:   { bg: "rgba(168,85,247,0.12)", text: "#c084fc", dot: "#a855f7", border: "rgba(168,85,247,0.25)" },
  Delivered: { bg: "rgba(20,184,166,0.12)", text: "#2dd4bf", dot: "#14b8a6", border: "rgba(20,184,166,0.25)" },
  Closed:    { bg: "rgba(107,114,128,0.12)",text: "#9ca3af", dot: "#6b7280", border: "rgba(107,114,128,0.25)" },
};

export default function AdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [authChecked, setAuthChecked] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [templateModal, setTemplateModal] = useState<any>(null);
  const [notifyModal, setNotifyModal] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingNote, setSavingNote] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [newCount, setNewCount] = useState(0);
  const [reminderModal, setReminderModal] = useState<any>(null);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderDueCount, setReminderDueCount] = useState(0);
  const [hideArchived, setHideArchived] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("Searching");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(0);

  function getWhatsAppMessage(request: any, template: string) {
    const name = request.customer_name || "there";
    const part = request.part_needed || "part";
    const vehicle = `${request.vehicle_year || ""} ${request.vehicle_make || ""} ${request.vehicle_model || ""}`.trim();
    const messages: Record<string, string> = {
      new:       `Hi ${name}, thanks for your request! We received your inquiry for a ${part} for your ${vehicle}. We are searching our supplier network and will get back to you shortly.\n\nCape Parts Finder`,
      searching: `Hi ${name}, just an update - we are actively searching for your ${part} for your ${vehicle}. We have multiple suppliers checking stock right now.\n\nCape Parts Finder`,
      quoted:    `Hi ${name}, great news! We found your ${part} for your ${vehicle}. Please reply and we will send you the price and details.\n\nCape Parts Finder`,
      ordered:   `Hi ${name}, your ${part} has been ordered and is on its way! We will update you once ready for delivery.\n\nCape Parts Finder`,
      delivered: `Hi ${name}, your ${part} has been delivered successfully. Thank you for using Cape Parts Finder!\n\nCape Parts Finder`,
      followup:  `Hi ${name}, just checking in on your ${part} request for your ${vehicle}. Can we help you with anything?\n\nCape Parts Finder`,
    };
    return messages[template] || messages.new;
  }

  function getStatusMessage(request: any, status: string) {
    const name = request.customer_name || "there";
    const part = request.part_needed || "part";
    const vehicle = `${request.vehicle_year || ""} ${request.vehicle_make || ""} ${request.vehicle_model || ""}`.trim();
    const msgs: Record<string, string> = {
      Searching: `Hi ${name}, we are now actively searching for your ${part} for your ${vehicle}. We will update you shortly.\n\nCape Parts Finder`,
      Quoted:    `Hi ${name}, great news! We have a quote ready for your ${part}. Please reply and we will send you the details.\n\nCape Parts Finder`,
      Ordered:   `Hi ${name}, your ${part} has been ordered! We will let you know once it is ready.\n\nCape Parts Finder`,
      Delivered: `Hi ${name}, your ${part} has been delivered. Thank you for choosing Cape Parts Finder!\n\nCape Parts Finder`,
      Closed:    `Hi ${name}, your request for a ${part} has been completed. Thank you!\n\nCape Parts Finder`,
    };
    return msgs[status] || null;
  }

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    fetchRequests();
    setAuthChecked(true);
  }

  async function fetchRequests() {
    const { data, error } = await supabase.from("parts_requests").select("*").order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setRequests(data || []);
    setNewCount((data || []).filter((r: any) => r.status === "New").length);
    // fetch due reminders count
    const { data: rem } = await supabase.from("reminders").select("id").eq("completed", false).lte("remind_at", new Date().toISOString());
    setReminderDueCount((rem || []).length);
    const nm: Record<number, string> = {};
    (data || []).forEach((r: any) => { if (r.internal_notes) nm[r.id] = r.internal_notes; });
    setNotes(nm);
  }

  async function saveNote(id: number) {
    setSavingNote(id);
    await supabase.from("parts_requests").update({ internal_notes: notes[id] || "" }).eq("id", id);
    setSavingNote(null);
  }

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    const request = requests.find(r => r.id === id);
    const { error } = await supabase.from("parts_requests").update({ status }).eq("id", id);
    if (error) { alert("Failed to update status"); setUpdatingId(null); return; }
    fetchRequests();
    setUpdatingId(null);
    if (request && getStatusMessage(request, status)) {
      setNotifyModal({ request: { ...request, status }, status });
    }
  }

  async function bulkUpdateStatus() {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map(id => supabase.from("parts_requests").update({ status: bulkStatus }).eq("id", id)));
    setSelectedIds(new Set());
    fetchRequests();
    setBulkUpdating(false);
  }

  async function sendBroadcast() {
    const selected = requests.filter(r => selectedIds.has(r.id));
    if (!selected.length || !broadcastMsg.trim()) return;
    setBroadcastSending(true);
    for (let i = 0; i < selected.length; i++) {
      const r = selected[i];
      const phone = (r.phone_number || "").replace(/\D/g, "");
      const msg = broadcastMsg.replace("{name}", r.customer_name || "there").replace("{part}", r.part_needed || "your part");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
      setBroadcastDone(i + 1);
      await new Promise(res => setTimeout(res, 800));
    }
    setBroadcastSending(false);
    setBroadcastModal(false);
    setBroadcastMsg("");
    setBroadcastDone(0);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map(r => r.id)));
    }
  }

  async function deleteRequest(id: number) {
    if (!confirm("Delete this request?")) return;
    await supabase.from("parts_requests").delete().eq("id", id);
    fetchRequests();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function exportToCSV() {
    const headers = ["Name","Phone","Email","Area","Make","Model","Year","VIN","Engine","Part","Preference","Details","Status","Date"];
    const rows = requests.map((r) => [r.customer_name, r.phone_number, r.email, r.area, r.vehicle_make, r.vehicle_model, r.vehicle_year, r.vin_number, r.engine_size, r.part_needed, r.part_preference, r.extra_details, r.status, new Date(r.created_at).toLocaleDateString("en-ZA")]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "parts-requests.csv"; a.click();
  }

  const filteredRequests = requests.filter((r) => {
    const matchesSearch = (r.customer_name + " " + r.vehicle_make + " " + r.vehicle_model + " " + r.part_needed + " " + (r.phone_number || "") + " " + (r.area || "")).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || (r.status || "New") === statusFilter;
    const matchesArchive = search.trim() ? true : (!hideArchived || (r.status || "New") !== "Closed");
    return matchesSearch && matchesStatus && matchesArchive;
  });

  const counts = {
    All: requests.length,
    New: requests.filter((r) => !r.status || r.status === "New").length,
    Searching: requests.filter((r) => r.status === "Searching").length,
    Quoted: requests.filter((r) => r.status === "Quoted").length,
    Ordered: requests.filter((r) => r.status === "Ordered").length,
    Delivered: requests.filter((r) => r.status === "Delivered").length,
    Closed: requests.filter((r) => r.status === "Closed").length,
  };

  const darkBg = { background: "#111111", minHeight: "100vh" };
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" };

  if (!authChecked) {
    return (
      <main style={darkBg} className="flex items-center justify-center">
        <div className="flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 32px" }}>
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <p className="text-gray-300 text-sm font-medium">Loading Dashboard...</p>
        </div>
      </main>
    );
  }

  async function saveReminder() {
    if (!reminderDate || !reminderTime) { alert("Pick a date and time"); return; }
    setSavingReminder(true);
    const remind_at = new Date(reminderDate + "T" + reminderTime).toISOString();
    await supabase.from("reminders").insert([{
      request_id: reminderModal.id,
      customer_name: reminderModal.customer_name,
      phone_number: reminderModal.phone_number,
      note: reminderNote,
      remind_at,
    }]);
    setSavingReminder(false);
    setReminderModal(null);
    setReminderDate("");
    setReminderTime("");
    setReminderNote("");
    alert("Reminder set for " + reminderModal.customer_name + "!");
  }

  return (
    <main style={darkBg}>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "20%", left: "-10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* NAV */}
        <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", background: "rgba(17,17,17,0.85)", position: "sticky", top: 0, zIndex: 50 }}>
          <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center" style={{ boxShadow: "0 0 16px rgba(249,115,22,0.35)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <span className="font-bold text-white text-[14px]">Cape Parts Finder</span>
            </div>
            <div className="flex gap-1">
              {[{ label: "Requests", href: "/admin", active: true }, { label: "Suppliers", href: "/suppliers" }, { label: "Sales", href: "/sales" }, { label: "Inventory", href: "/inventory" }, { label: "Analytics", href: "/analytics" }, { label: "Reminders", href: "/reminders", badge: reminderDueCount }].map((n) => (
                <a key={n.href} href={n.href} className="px-3.5 py-1.5 rounded-lg text-[13px] no-underline transition font-medium"
                  style={n.active ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" } : { color: "rgba(255,255,255,0.4)", border: "1px solid transparent" }}>
                  {n.label}{n.href === "/admin" && newCount > 0 && (<span style={{ marginLeft: 6, background: "#f97316", color: "white", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 6px", lineHeight: "16px", display: "inline-block" }}>{newCount}</span>)}{n.badge && n.badge > 0 ? (<span style={{ marginLeft: 6, background: "#fbbf24", color: "#0a0a0a", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 6px", lineHeight: "16px", display: "inline-block" }}>{n.badge}</span>) : null}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportToCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
              </button>
              <button onClick={fetchRequests} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
              <button onClick={logout} className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-5 py-6">

          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total", value: counts.All, color: "#f97316" },
              { label: "New", value: counts.New, color: "#f97316" },
              { label: "In Progress", value: counts.Searching + counts.Quoted, color: "#3b82f6" },
              { label: "Delivered", value: counts.Delivered, color: "#14b8a6" },
            ].map((card) => (
              <div key={card.label} className="rounded-xl p-4 relative overflow-hidden" style={cardStyle}>
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ background: card.color }} />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{card.label}</p>
                <p className="text-[32px] font-black leading-none" style={{ color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* FILTERS */}
          <div className="rounded-xl p-4 mb-4" style={cardStyle}>
            <div className="flex flex-col lg:flex-row gap-3">
              <input type="text" placeholder="Search name, phone, vehicle or part..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-lg px-4 py-2.5 text-[13px] outline-none text-white placeholder-gray-600"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg px-4 py-2.5 text-[13px] outline-none cursor-pointer text-white"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <option value="All" style={{ background: "#1a1a1a" }}>All ({counts.All})</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ background: "#1a1a1a" }}>{s} ({counts[s as keyof typeof counts] ?? 0})</option>)}
              </select>
            </div>
            <div className="flex gap-1.5 flex-wrap mt-3">
              {["All", ...STATUS_OPTIONS].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] transition cursor-pointer font-medium"
                  style={statusFilter === s
                    ? { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.35)", color: "#fb923c" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                  {s} {s === "All" ? `(${counts.All})` : `(${counts[s as keyof typeof counts] ?? 0})`}
                </button>
              ))}
            </div>
          </div>

          {/* BULK SELECT + ARCHIVE TOGGLE */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={toggleSelectAll}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                <div className="w-3.5 h-3.5 rounded flex items-center justify-center"
                  style={{ background: selectedIds.size === filteredRequests.length && filteredRequests.length > 0 ? "#f97316" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  {selectedIds.size === filteredRequests.length && filteredRequests.length > 0 && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </div>
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
              </button>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                    className="rounded-lg px-3 py-1.5 text-[12px] outline-none cursor-pointer text-white"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ background: "#1a1a1a" }}>{s}</option>)}
                  </select>
                  <button onClick={bulkUpdateStatus} disabled={bulkUpdating}
                    className="px-4 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition text-white"
                    style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 2px 12px rgba(249,115,22,0.3)", opacity: bulkUpdating ? 0.6 : 1 }}>
                    {bulkUpdating ? "Updating..." : `Update ${selectedIds.size} request${selectedIds.size > 1 ? "s" : ""}`}
                  </button>
                  <button onClick={() => setSelectedIds(new Set())}
                    className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer transition"
                    style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    Clear
                  </button>
                  <button onClick={() => { setBroadcastModal(true); setBroadcastMsg(""); setBroadcastDone(0); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition"
                    style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)", color: "#25D366" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    WhatsApp Broadcast ({selectedIds.size})
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {counts.Closed > 0 && (
                <button onClick={() => setHideArchived(!hideArchived)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition"
                  style={hideArchived
                    ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
                    : { background: "rgba(107,114,128,0.12)", border: "1px solid rgba(107,114,128,0.25)", color: "#9ca3af" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                  </svg>
                  {hideArchived ? `Show ${counts.Closed} archived` : "Hide archived"}
                </button>
              )}
              <span className="text-[12px] text-gray-600">{filteredRequests.length} requests</span>
            </div>
          </div>

          {/* REQUEST CARDS */}
          <div className="space-y-2">
            {filteredRequests.length === 0 && (
              <div className="rounded-xl p-10 text-center" style={cardStyle}>
                <p className="text-gray-600 text-sm">
                  {hideArchived && counts.Closed > 0 ? `No active requests · ${counts.Closed} archived` : "No requests found"}
                </p>
                {hideArchived && counts.Closed > 0 && (
                  <button onClick={() => setHideArchived(false)} className="mt-3 text-[12px] cursor-pointer transition" style={{ color: "#9ca3af" }}>
                    Show archived →
                  </button>
                )}
              </div>
            )}

            {filteredRequests.map((request) => {
              const st = STATUS_STYLE[request.status || "New"] ?? STATUS_STYLE.New;
              const isExpanded = expandedId === request.id;
              const isSelected = selectedIds.has(request.id);
              const isClosed = (request.status || "New") === "Closed";
              const isStale = !isClosed && (Date.now() - new Date(request.updated_at || request.created_at).getTime()) > 3 * 24 * 60 * 60 * 1000;
              const initial = (request.customer_name || "?")[0].toUpperCase();
              const allPhotos: string[] = request.photo_urls?.length ? request.photo_urls : request.photo_url ? [request.photo_url] : [];

              return (
                <div key={request.id} className="rounded-xl overflow-hidden transition" style={{
                  ...cardStyle,
                  border: isSelected ? "1px solid rgba(249,115,22,0.4)" : isClosed ? "1px solid rgba(107,114,128,0.15)" : "1px solid rgba(255,255,255,0.07)",
                  background: isSelected ? "rgba(249,115,22,0.05)" : isClosed ? "rgba(107,114,128,0.04)" : "rgba(255,255,255,0.03)",
                  opacity: isClosed ? 0.7 : 1,
                }}>

                  <div className="px-4 py-3 flex items-center gap-3">
                    <div onClick={() => toggleSelect(request.id)}
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 cursor-pointer transition"
                      style={{ background: isSelected ? "#f97316" : "rgba(255,255,255,0.06)", border: isSelected ? "1px solid #f97316" : "1px solid rgba(255,255,255,0.15)" }}>
                      {isSelected && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold flex-shrink-0 text-orange-400"
                      style={{ background: "rgba(249,115,22,0.12)" }}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : request.id)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[13px] text-white">{request.customer_name}</span>
                        <span className="text-gray-600 text-[12px]">·</span>
                        <span className="text-gray-400 text-[12px] truncate">{request.part_needed || "—"}</span>
                        <span className="text-gray-600 text-[12px]">·</span>
                        <span className="text-gray-500 text-[12px]">{request.vehicle_make} {request.vehicle_model} {request.vehicle_year}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-600">{new Date(request.created_at).toLocaleDateString("en-ZA")}</span>
                        <span className="text-gray-700 text-[10px]">·</span>
                        <span className="text-[10px]" style={{ color: st.text }}>{request.status || "New"}</span>{isStale && <span style={{marginLeft:6,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.25)",color:"#f87171",borderRadius:999,fontSize:9,fontWeight:700,padding:"2px 6px"}}>&#9200; Follow up</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : request.id)}>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                        <span className="w-1 h-1 rounded-full" style={{ background: st.dot }} />
                        {request.status || "New"}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); setReminderModal(request); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition flex-shrink-0"
                        style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}
                        title="Set reminder">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      </button>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="px-4 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-[12px]">
                        {[
                          { label: "Phone", value: request.phone_number },
                          { label: "Email", value: request.email },
                          { label: "Area", value: request.area },
                          { label: "VIN", value: request.vin_number },
                          { label: "Engine", value: request.engine_size },
                          { label: "Preference", value: request.part_preference },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</p>
                            <p className="text-gray-300 font-medium">{value || "—"}</p>
                          </div>
                        ))}
                      </div>

                      {request.extra_details && (
                        <div className="px-4 pb-3">
                          <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(249,115,22,0.7)" }}>Extra Details</p>
                            <p className="text-gray-300 text-[12px] leading-relaxed">{request.extra_details}</p>
                          </div>
                        </div>
                      )}

                      {allPhotos.length > 0 && (
                        <div className="px-4 pb-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                            Photos ({allPhotos.length})
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {allPhotos.map((url, i) => (
                              <img key={i} src={url} alt={`Photo ${i + 1}`}
                                className="w-24 h-20 object-cover rounded-xl cursor-pointer"
                                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                                onClick={() => window.open(url)} />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
                        <select value={request.status || "New"} onChange={(e) => updateStatus(request.id, e.target.value)}
                          disabled={updatingId === request.id}
                          className="rounded-lg px-3 py-2 text-[12px] outline-none cursor-pointer text-white"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          {STATUS_OPTIONS.map((s) => <option key={s} style={{ background: "#1a1a1a" }}>{s}</option>)}
                        </select>
                        <button onClick={() => router.push(`/suppliers?requestId=${request.id}&part=${encodeURIComponent(request.part_needed||"")}&make=${encodeURIComponent(request.vehicle_make||"")}&model=${encodeURIComponent(request.vehicle_model||"")}&year=${encodeURIComponent(request.vehicle_year||"")}&photo=${encodeURIComponent(request.photo_url||"")}&vin=${encodeURIComponent(request.vin_number||"")}`)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.25)", color: "#fb923c" }}>
                          Request Quote
                        </button>
                        <button onClick={() => router.push(`/quotes/${request.id}`)}
                          className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                          View Quotes
                        </button>
                        <button onClick={() => setTemplateModal(request)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                          WhatsApp
                        </button>
                        <button onClick={() => window.open("mailto:" + request.email)}
                          className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                          Email
                        </button>
                        <button onClick={() => deleteRequest(request.id)}
                          className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition ml-auto"
                          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                          Delete
                        </button>
                      </div>

                      <div className="px-4 pb-4">
                        <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Internal Notes</p>
                          <textarea value={notes[request.id] || ""} onChange={(e) => setNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                            placeholder="Add private notes..." rows={2}
                            className="w-full rounded-lg px-3 py-2 text-[12px] outline-none resize-none text-gray-300 placeholder-gray-700"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }} />
                          <button onClick={() => saveNote(request.id)} disabled={savingNote === request.id}
                            className="mt-2 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                            {savingNote === request.id ? "Saving..." : "Save Note"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {/* BROADCAST MODAL */}
      {broadcastModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h2 className="font-bold text-[15px] text-white">WhatsApp Broadcast</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Sending to {selectedIds.size} customer{selectedIds.size > 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setBroadcastModal(false)} className="text-gray-500 hover:text-white text-lg cursor-pointer bg-transparent border-none">×</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Quick Templates</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Follow Up", msg: "Hi {name}, just checking in on your request for {part}. Can we help you with anything?\n\nCape Parts Finder" },
                    { label: "Promotion", msg: "Hi {name}, Cape Parts Finder has great deals this week! Contact us for fast quotes on any part.\n\nCape Parts Finder" },
                    { label: "Quote Ready", msg: "Hi {name}, great news! We have a quote ready for {part}. Please reply and we will send you the details.\n\nCape Parts Finder" },
                    { label: "Check In", msg: "Hi {name}, we are still working on sourcing {part} for you. We will update you very soon.\n\nCape Parts Finder" },
                  ].map(t => (
                    <button key={t.label} onClick={() => setBroadcastMsg(t.msg)}
                      className="px-3 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition text-left"
                      style={{ background: broadcastMsg === t.msg ? "rgba(37,211,102,0.12)" : "rgba(255,255,255,0.04)", border: broadcastMsg === t.msg ? "1px solid rgba(37,211,102,0.3)" : "1px solid rgba(255,255,255,0.08)", color: broadcastMsg === t.msg ? "#25D366" : "rgba(255,255,255,0.6)" }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Message <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· use {"{name}"} and {"{part}"} as placeholders</span></p>
                <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} rows={5}
                  placeholder="Type your message..."
                  className="w-full rounded-xl px-4 py-3 text-[13px] outline-none resize-none text-white placeholder-gray-600"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
              {broadcastSending && (
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)" }}>
                  <p className="text-[12px] font-medium" style={{ color: "#25D366" }}>Opening WhatsApp {broadcastDone} of {selectedIds.size}...</p>
                  <p className="text-[10px] text-gray-500 mt-1">Allow popups · Each opens in a new tab</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={sendBroadcast} disabled={broadcastSending || !broadcastMsg.trim()}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition text-white flex items-center justify-center gap-2"
                  style={{ background: broadcastMsg.trim() ? "linear-gradient(135deg, #25D366, #128C7E)" : "rgba(37,211,102,0.3)", boxShadow: broadcastMsg.trim() ? "0 4px 16px rgba(37,211,102,0.25)" : "none" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  {broadcastSending ? `Sending ${broadcastDone}/${selectedIds.size}...` : `Send to ${selectedIds.size} customer${selectedIds.size > 1 ? "s" : ""}`}
                </button>
                <button onClick={() => setBroadcastModal(false)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP TEMPLATE MODAL */}
      {templateModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h2 className="font-bold text-[15px] text-white">WhatsApp Templates</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">To: {templateModal.customer_name} · {templateModal.phone_number}</p>
              </div>
              <button onClick={() => setTemplateModal(null)} className="text-gray-500 hover:text-white text-lg cursor-pointer bg-transparent border-none">×</button>
            </div>
            <div className="p-4 space-y-2">
              {[
                { key: "new", label: "New Request" },
                { key: "searching", label: "Searching for Part" },
                { key: "quoted", label: "Quote Ready" },
                { key: "ordered", label: "Part Ordered" },
                { key: "delivered", label: "Part Delivered" },
                { key: "followup", label: "Follow Up" },
              ].map((t) => (
                <button key={t.key}
                  onClick={() => { const msg = getWhatsAppMessage(templateModal, t.key); const phone = templateModal.phone_number.replace(/\D/g, ""); window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`); setTemplateModal(null); }}
                  className="w-full text-left px-4 py-3 rounded-xl transition cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="font-semibold text-[12px] text-white">{t.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5 truncate">{getWhatsAppMessage(templateModal, t.key).split("\n")[0]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STATUS NOTIFICATION MODAL */}
      {notifyModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Notify Customer?</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Status changed to: <span style={{ color: "#fb923c" }}>{notifyModal.status}</span></p>
            </div>
            <div className="p-5">
              <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[12px] text-gray-300 whitespace-pre-line leading-relaxed">{getStatusMessage(notifyModal.request, notifyModal.status)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { const msg = getStatusMessage(notifyModal.request, notifyModal.status); const phone = notifyModal.request.phone_number.replace(/\D/g, ""); window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg || "")}`); setNotifyModal(null); }}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 16px rgba(249,115,22,0.25)" }}>
                  Send WhatsApp
                </button>
                <button onClick={() => setNotifyModal(null)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REMINDER MODAL */}
      {reminderModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setReminderModal(null); }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Set Callback Reminder</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{reminderModal.customer_name} · {reminderModal.phone_number}</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Date</label>
                <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Time</label>
                <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Note (optional)</label>
                <textarea value={reminderNote} onChange={e => setReminderNote(e.target.value)}
                  placeholder="e.g. Follow up on brake pad quote..."
                  rows={2} className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-gray-300 resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveReminder} disabled={savingReminder}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: savingReminder ? "rgba(251,191,36,0.4)" : "linear-gradient(135deg,#f59e0b,#d97706)", border: "none" }}>
                  {savingReminder ? "Saving..." : "Set Reminder 🔔"}
                </button>
                <button onClick={() => setReminderModal(null)}
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
