"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const STATUS_OPTIONS = ["New", "Searching", "Quoted", "Ordered", "Delivered", "Closed"];

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  New:       { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316", border: "#FED7AA" },
  Searching: { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6", border: "#BFDBFE" },
  Quoted:    { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E", border: "#BBF7D0" },
  Ordered:   { bg: "#FDF4FF", text: "#7E22CE", dot: "#A855F7", border: "#E9D5FF" },
  Delivered: { bg: "#F0FDFA", text: "#0F766E", dot: "#14B8A6", border: "#99F6E4" },
  Closed:    { bg: "#F9FAFB", text: "#374151", dot: "#9CA3AF", border: "#E5E7EB" },
};

export default function AdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [authChecked, setAuthChecked] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [templateModal, setTemplateModal] = useState<any>(null);

  function getWhatsAppMessage(request: any, template: string) {
    const name = request.customer_name || "there";
    const part = request.part_needed || "part";
    const vehicle = `${request.vehicle_year || ""} ${request.vehicle_make || ""} ${request.vehicle_model || ""}`.trim();
    const messages: Record<string, string> = {
      new: `Hi ${name}, thanks for your request! We received your inquiry for a ${part} for your ${vehicle}. We are searching our supplier network and will get back to you shortly.\n\nCape Parts Finder`,
      searching: `Hi ${name}, just an update - we are actively searching for your ${part} for your ${vehicle}. We have multiple suppliers checking stock right now.\n\nCape Parts Finder`,
      quoted: `Hi ${name}, great news! We found your ${part} for your ${vehicle}. Please reply and we will send you the price and details.\n\nCape Parts Finder`,
      ordered: `Hi ${name}, your ${part} has been ordered and is on its way! We will update you once ready for delivery.\n\nCape Parts Finder`,
      delivered: `Hi ${name}, your ${part} has been delivered successfully. Thank you for using Cape Parts Finder!\n\nCape Parts Finder`,
      followup: `Hi ${name}, just checking in on your ${part} request for your ${vehicle}. Can we help you with anything?\n\nCape Parts Finder`,
    };
    return messages[template] || messages.new;
  }

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    fetchRequests();
    setAuthChecked(true);
  }

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("parts_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setRequests(data || []);
  }

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    const { error } = await supabase.from("parts_requests").update({ status }).eq("id", id);
    if (error) { alert("Failed to update status"); setUpdatingId(null); return; }
    fetchRequests();
    setUpdatingId(null);
  }

  async function deleteRequest(id: number) {
    if (!confirm("Delete this request?")) return;
    const { error } = await supabase.from("parts_requests").delete().eq("id", id);
    if (error) { alert("Failed to delete request"); return; }
    fetchRequests();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function exportToCSV() {
    const headers = ["Name","Phone","Email","Area","Make","Model","Year","VIN","Engine","Part","Preference","Details","Status","Date"];
    const rows = requests.map((r) => [
      r.customer_name, r.phone_number, r.email, r.area,
      r.vehicle_make, r.vehicle_model, r.vehicle_year,
      r.vin_number, r.engine_size, r.part_needed,
      r.part_preference, r.extra_details, r.status,
      new Date(r.created_at).toLocaleDateString("en-ZA"),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "parts-requests.csv"; a.click();
  }

  const filteredRequests = requests.filter((r) => {
    const matchesSearch = (r.customer_name + " " + r.vehicle_make + " " + r.vehicle_model + " " + r.part_needed)
      .toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || (r.status || "New") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    All:       requests.length,
    New:       requests.filter((r) => !r.status || r.status === "New").length,
    Searching: requests.filter((r) => r.status === "Searching").length,
    Quoted:    requests.filter((r) => r.status === "Quoted").length,
    Ordered:   requests.filter((r) => r.status === "Ordered").length,
    Delivered: requests.filter((r) => r.status === "Delivered").length,
    Closed:    requests.filter((r) => r.status === "Closed").length,
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="bg-white px-10 py-7 rounded-2xl border border-gray-100 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <p className="text-gray-700 text-base font-medium">Loading Dashboard...</p>
        </div>

      {/* WHATSAPP TEMPLATE MODAL */}
      {templateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[16px] text-gray-900">WhatsApp Templates</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">To: {templateModal.customer_name} · {templateModal.phone_number}</p>
              </div>
              <button onClick={() => setTemplateModal(null)} className="text-gray-400 hover:text-gray-700 text-xl cursor-pointer bg-transparent border-none">x</button>
            </div>
            <div className="p-5 space-y-2">
              {[
                { key: "new", label: "New Request", color: "orange" },
                { key: "searching", label: "Searching for Part", color: "blue" },
                { key: "quoted", label: "Quote Ready", color: "green" },
                { key: "ordered", label: "Part Ordered", color: "purple" },
                { key: "delivered", label: "Part Delivered", color: "teal" },
                { key: "followup", label: "Follow Up", color: "gray" },
              ].map((t) => (
                <button key={t.key}
                  onClick={() => { const msg = getWhatsAppMessage(templateModal, t.key); const phone = templateModal.phone_number.replace(/\D/g, ""); window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`); setTemplateModal(null); }}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition cursor-pointer">
                  <div className="font-semibold text-[13px] text-gray-900">{t.label}</div>
                  <div className="text-[12px] text-gray-400 mt-0.5 truncate">{getWhatsAppMessage(templateModal, t.key).split("\n")[0]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9]">

      {/* â”€â”€ TOP NAV â”€â”€ */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-orange-500 flex items-center justify-center flex-shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-[15px] text-gray-900 leading-tight">Cape Parts Finder</div>
              <div className="text-[11px] text-gray-400">Admin Dashboard</div>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex gap-1">
            <a href="/admin"
              className="px-4 py-1.5 rounded-lg text-sm no-underline font-semibold bg-orange-50 text-orange-600">
              Requests
            </a>
            <a href="/suppliers"
              className="px-4 py-1.5 rounded-lg text-sm no-underline text-gray-500 hover:bg-gray-50 font-normal">
              Suppliers
            </a>
            <a href="/sales"
              className="px-4 py-1.5 rounded-lg text-sm no-underline text-gray-500 hover:bg-gray-50 font-normal">
              Sales
            </a>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition cursor-pointer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
            <button onClick={fetchRequests} title="Refresh"
              className="w-[34px] h-[34px] flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
            <button onClick={logout}
              className="px-3.5 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 text-[13px] font-medium hover:bg-red-100 transition cursor-pointer">
              Logout
            </button>
          </div>

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-7">

        {/* â”€â”€ PAGE HEADER â”€â”€ */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Parts Requests</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and track all incoming customer requests</p>
        </div>

        {/* â”€â”€ STATS CARDS â”€â”€ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          {[
            { label: "Total Requests", value: counts.All,                          accent: "#F97316" },
            { label: "New",            value: counts.New,                          accent: "#F97316" },
            { label: "In Progress",    value: counts.Searching + counts.Quoted,    accent: "#3B82F6" },
            { label: "Delivered",      value: counts.Delivered,                    accent: "#14B8A6" },
          ].map((card, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: card.accent }} />
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{card.label}</p>
              <p className="text-[38px] font-bold text-gray-900 leading-none mt-2 tracking-tight">{card.value}</p>
            </div>
          ))}
        </div>

        {/* â”€â”€ SEARCH + STATUS FILTER â”€â”€ */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by customer, vehicle or part..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-300 bg-white text-gray-700 cursor-pointer"
            >
              <option value="All">All ({counts.All})</option>
              <option value="New">New ({counts.New})</option>
              <option value="Searching">Searching ({counts.Searching})</option>
              <option value="Quoted">Quoted ({counts.Quoted})</option>
              <option value="Ordered">Ordered ({counts.Ordered})</option>
              <option value="Delivered">Delivered ({counts.Delivered})</option>
              <option value="Closed">Closed ({counts.Closed})</option>
            </select>
          </div>

          {/* Status pill filters */}
          <div className="flex gap-1.5 flex-wrap mt-3">
            {["All", ...STATUS_OPTIONS].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-[12px] transition-all cursor-pointer border ${
                  statusFilter === s
                    ? "border-orange-400 bg-orange-50 text-orange-600 font-semibold"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}>
                {s} ({s === "All" ? counts.All : counts[s as keyof typeof counts] ?? 0})
              </button>
            ))}
          </div>
        </div>

        {/* â”€â”€ REQUEST CARDS â”€â”€ */}
        <div className="space-y-4">
          {filteredRequests.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-gray-400 text-sm">
              No requests found
            </div>
          )}

          {filteredRequests.map((request) => {
            const st = STATUS_STYLE[request.status || "New"] ?? STATUS_STYLE.New;
            const initial = (request.customer_name || "?")[0].toUpperCase();

            return (
              <div key={request.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* â”€â”€ CARD HEADER â”€â”€ */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                    {/* Customer info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-[15px] flex-shrink-0">
                        {initial}
                      </div>
                      <div>
                        <h2 className="text-[17px] font-bold text-gray-900">{request.customer_name}</h2>
                        <p className="text-[12px] text-gray-400 mt-0.5">
                          {new Date(request.created_at).toLocaleString("en-ZA")}
                        </p>
                      </div>
                    </div>

                    {/* Status + Delete */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                        {request.status || "New"}
                      </span>
                      <select
                        value={request.status || "New"}
                        onChange={(e) => updateStatus(request.id, e.target.value)}
                        disabled={updatingId === request.id}
                        className="border border-gray-200 bg-white px-3 py-2 rounded-lg text-[13px] text-gray-700 outline-none cursor-pointer focus:border-orange-300"
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                      <button
                        onClick={() => deleteRequest(request.id)}
                        className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-3.5 py-2 rounded-lg text-[13px] font-medium transition cursor-pointer"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        Delete
                      </button>
                    </div>

                  </div>
                </div>

                {/* â”€â”€ CARD BODY â”€â”€ */}
                <div className="p-5">
                  <div className="grid lg:grid-cols-2 gap-6 text-sm">

                    {/* Left column */}
                    <div className="space-y-3">
                      {[
                        { label: "Phone",  value: request.phone_number },
                        { label: "Email",  value: request.email },
                        { label: "Area",   value: request.area },
                        { label: "VIN",    value: request.vin_number },
                        { label: "Engine", value: request.engine_size },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                          <p className="font-medium text-gray-900 mt-0.5">{value || "â€”"}</p>
                        </div>
                      ))}
                    </div>

                    {/* Right column */}
                    <div className="space-y-3">
                      {[
                        { label: "Vehicle",     value: `${request.vehicle_make} ${request.vehicle_model} ${request.vehicle_year}` },
                        { label: "Part Needed", value: request.part_needed },
                        { label: "Preference",  value: request.part_preference },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                          <p className="font-medium text-gray-900 mt-0.5">{value || "â€”"}</p>
                        </div>
                      ))}
                    </div>

                  </div>

                  {/* Extra details */}
                  {request.extra_details && (
                    <div className="mt-5 bg-orange-50 border border-orange-100 rounded-xl p-4">
                      <p className="text-[12px] font-semibold text-orange-700 mb-1">Extra Details</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{request.extra_details}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <button
                      onClick={() => router.push(`/suppliers?requestId=${request.id}&part=${encodeURIComponent(request.part_needed||"")}&make=${encodeURIComponent(request.vehicle_make||"")}&model=${encodeURIComponent(request.vehicle_model||"")}&year=${encodeURIComponent(request.vehicle_year||"")}&photo=${encodeURIComponent(request.photo_url||"")}&vin=${encodeURIComponent(request.vin_number||"")}`)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold transition cursor-pointer mb-1"
                    >
                      🔍 Request Supplier Quote
                    </button>
                    <button
                      onClick={() => router.push(`/suppliers?requestId=${request.id}&part=${encodeURIComponent(request.part_needed||"")}&make=${encodeURIComponent(request.vehicle_make||"")}&model=${encodeURIComponent(request.vehicle_model||"")}&year=${encodeURIComponent(request.vehicle_year||"")}&photo=${encodeURIComponent(request.photo_url||"")}&vin=${encodeURIComponent(request.vin_number||"")}`)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[13px] font-medium transition cursor-pointer"
                    >
                      Request Supplier Quote
                    </button>
                    <button
                      onClick={() => router.push(`/quotes/${request.id}`)}
                      className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-[13px] font-medium transition cursor-pointer"
                    >
                      View Quotes
                    </button>
                    <button onClick={() => setTemplateModal(request)}
                      className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-[13px] font-medium transition cursor-pointer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                      WhatsApp
                    </button>
                      onClick={() => window.open("https://wa.me/" + request.phone_number.replace(/\D/g, ""))}
                      className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-[13px] font-medium transition cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => window.open("mailto:" + request.email)}
                      className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-[13px] font-medium transition cursor-pointer"
                    >
                      Email
                    </button>
                  </div>

                  {/* Photo */}
                  {request.photo_url && (
                    <div className="mt-5">
                      <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Uploaded Photo</p>
                      <img
                        src={request.photo_url}
                        alt="Uploaded"
                        className="w-72 rounded-2xl border border-gray-200 shadow-sm"
                      />
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WHATSAPP TEMPLATE MODAL */}
      {templateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[16px] text-gray-900">WhatsApp Templates</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">To: {templateModal.customer_name} · {templateModal.phone_number}</p>
              </div>
              <button onClick={() => setTemplateModal(null)} className="text-gray-400 hover:text-gray-700 text-xl cursor-pointer bg-transparent border-none">x</button>
            </div>
            <div className="p-5 space-y-2">
              {[
                { key: "new", label: "New Request", color: "orange" },
                { key: "searching", label: "Searching for Part", color: "blue" },
                { key: "quoted", label: "Quote Ready", color: "green" },
                { key: "ordered", label: "Part Ordered", color: "purple" },
                { key: "delivered", label: "Part Delivered", color: "teal" },
                { key: "followup", label: "Follow Up", color: "gray" },
              ].map((t) => (
                <button key={t.key}
                  onClick={() => { const msg = getWhatsAppMessage(templateModal, t.key); const phone = templateModal.phone_number.replace(/\D/g, ""); window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`); setTemplateModal(null); }}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition cursor-pointer">
                  <div className="font-semibold text-[13px] text-gray-900">{t.label}</div>
                  <div className="text-[12px] text-gray-400 mt-0.5 truncate">{getWhatsAppMessage(templateModal, t.key).split("\n")[0]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}










