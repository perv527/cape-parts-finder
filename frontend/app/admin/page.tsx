"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/lib/settings";
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
  const settings = useSettings();
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
  const [hideArchived, setHideArchived] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("Searching");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(0);
  const [reminderModal, setReminderModal] = useState<any>(null);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderDueCount, setReminderDueCount] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [quickSaleModal, setQuickSaleModal] = useState<any>(null);
  const [quickSalePrice, setQuickSalePrice] = useState("");
  const [quickSaleCost, setQuickSaleCost] = useState("");
  const [savingQuickSale, setSavingQuickSale] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  function getWhatsAppMessage(request: any, template: string) {
    const name = request.customer_name || "there";
    const part = request.part_needed || "part";
    const vehicle = `${request.vehicle_year || ""} ${request.vehicle_make || ""} ${request.vehicle_model || ""}`.trim();
    const messages: Record<string, string> = {
      new:       `Hi ${name}, thanks for your request! We received your inquiry for a ${part} for your ${vehicle}. We are searching our supplier network and will get back to you shortly.\n\nCape Parts Finder`,
      searching: `Hi ${name}! We are actively searching for your ${part}${vehicle ? " for your " + vehicle : ""} across our supplier network. We will update you shortly.\n\nTrack your request: capepartsfinder.co.za/track\n\nCape Parts Finder`,
      quoted:    `Hi ${name}! Great news - we found your ${part}! Please reply and we will send you the price and details right away.\n\nTrack your request: capepartsfinder.co.za/track\n\nCape Parts Finder`,
      ordered:   `Hi ${name}, your ${part} has been ordered and is on its way! We will update you once ready for delivery.\n\nCape Parts Finder`,
      delivered: `Hi ${name}! Your ${part} has been delivered successfully. We hope everything is perfect!\n\nWe would love a quick review: capepartsfinder.co.za/review\n\nThank you for choosing Cape Parts Finder!`,
      followup:  `Hi ${name}! Just checking in on your ${part} request${vehicle ? " for your " + vehicle : ""}. Are you still looking for this part? We are here to help!\n\nCape Parts Finder`,
    };
    return messages[template] || messages.new;
  }

  function getStatusMessage(request: any, status: string) {
    const name = request.customer_name || "there";
    const part = request.part_needed || "part";
    const vehicle = `${request.vehicle_year || ""} ${request.vehicle_make || ""} ${request.vehicle_model || ""}`.trim();
        const custom: Record<string, string> = {
      Searching: settings.msg_searching ? settings.msg_searching.replace(/{name}/g, name).replace(/{part}/g, part) : "",
      Quoted: settings.msg_quoted ? settings.msg_quoted.replace(/{name}/g, name).replace(/{part}/g, part) : "",
      Ordered: settings.msg_ordered ? settings.msg_ordered.replace(/{name}/g, name).replace(/{part}/g, part) : "",
      Delivered: settings.msg_delivered ? settings.msg_delivered.replace(/{name}/g, name).replace(/{part}/g, part) : "",
      Closed: settings.msg_followup ? settings.msg_followup.replace(/{name}/g, name).replace(/{part}/g, part) : "",
    };
const msgs: Record<string, string> = {
      Searching: `Hi ${name}, we are now actively searching for your ${part} for your ${vehicle}. We will update you shortly.\n\nCape Parts Finder`,
      Quoted:    `Hi ${name}, great news! We have a quote ready for your ${part}. Please reply and we will send you the details.\n\nCape Parts Finder`,
      Ordered:   `Hi ${name}, your ${part} has been ordered! We will let you know once it is ready.\n\nCape Parts Finder`,
      Delivered: `Hi ${name}, your ${part} has been delivered. Thank you for choosing Cape Parts Finder!\n\nCape Parts Finder`,
      Closed:    `Hi ${name}, your request for a ${part} has been completed. Thank you!\n\nCape Parts Finder`,
    };
    return custom[status] || msgs[status] || null;
  }

  useEffect(() => {
    checkAuth();
    // Listen for auth state changes - auto redirect on session expiry
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
    }, 60000);
    return () => { subscription.unsubscribe(); clearInterval(warningTimer); };
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    // Refresh session to keep it alive
    await supabase.auth.refreshSession();
    fetchRequests();
    setAuthChecked(true);
  }

  async function fetchRequests() {
    const { data, error } = await supabase.from("parts_requests").select("*").order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setRequests(data || []);
    setNewCount((data || []).filter((r: any) => r.status === "New").length);
    const nm: Record<number, string> = {};
    (data || []).forEach((r: any) => { if (r.internal_notes) nm[r.id] = r.internal_notes; });
    setNotes(nm);
    const { data: rem } = await supabase.from("reminders").select("id").eq("completed", false).lte("remind_at", new Date().toISOString());
    setReminderDueCount((rem || []).length);
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
    if (status === "Delivered") {
      setTimeout(() => setReviewModal(request), 800);
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

  function exportToCSV() {
    const headers = ["Name","Phone","Email","Area","Make","Model","Year","VIN","Engine","Part","Preference","Details","Status","Date"];
    const rows = requests.map((r) => [r.customer_name, r.phone_number, r.email, r.area, r.vehicle_make, r.vehicle_model, r.vehicle_year, r.vin_number, r.engine_size, r.part_needed, r.part_preference, r.extra_details, r.status, new Date(r.created_at).toLocaleDateString("en-ZA")]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "parts-requests.csv"; a.click();
  }

  // Reset page when search or filter changes
  useEffect(() => { setPage(0); }, [search, statusFilter]);

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

  async function sendDailyReport() {
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const n = "\n";

    const { data: todaySales } = await supabase.from("sales").select("*")
      .gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString());
    const revenue = (todaySales || []).reduce((s: number, x: any) => s + Number(x.selling_price || 0), 0);
    const profit = (todaySales || []).reduce((s: number, x: any) => s + Number(x.profit || 0), 0);

    const { data: monthExp } = await supabase.from("expenses").select("amount")
      .gte("date", new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
    const expTotal = (monthExp || []).reduce((s: number, e: any) => s + Number(e.amount), 0);

    const { data: dueRem } = await supabase.from("reminders").select("customer_name, note")
      .eq("completed", false).lte("remind_at", now.toISOString()).limit(5);

    const todayReqs = requests.filter((r: any) => {
      const d = new Date(r.created_at);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const stale = requests.filter((r: any) => {
      const isClosed = r.status === "Closed" || r.status === "Delivered";
      return !isClosed && (Date.now() - new Date(r.updated_at || r.created_at).getTime()) > 3 * 24 * 60 * 60 * 1000;
    });

    const pending = requests.filter((r: any) => !r.status || r.status === "New" || r.status === "Searching");

    let msg = "";
    msg += "Cape Parts Finder - Daily Report" + n;
    msg += todayStr + n + n;
    msg += "TODAY" + n;
    msg += "New requests: " + todayReqs.length + n;
    msg += "Sales closed: " + (todaySales || []).length + n;
    msg += "Revenue: R" + revenue.toFixed(0) + n;
    msg += "Profit: R" + profit.toFixed(0) + n + n;
    msg += "PIPELINE" + n;
    msg += "Active requests: " + requests.filter((r: any) => r.status !== "Closed").length + n;
    msg += "Pending: " + pending.length + n;
    msg += "Quoted: " + counts.Quoted + n;
    msg += "Ordered: " + counts.Ordered + n + n;

    if (stale.length > 0) {
      msg += "FOLLOW-UPS NEEDED (" + stale.length + ")" + n;
      stale.slice(0, 3).forEach((r: any) => { msg += "- " + r.customer_name + " / " + r.part_needed + n; });
      if (stale.length > 3) msg += "...and " + (stale.length - 3) + " more" + n;
      msg += n;
    }

    if ((dueRem || []).length > 0) {
      msg += "REMINDERS DUE (" + (dueRem || []).length + ")" + n;
      (dueRem || []).forEach((r: any) => { msg += "- " + r.customer_name + (r.note ? " / " + r.note : "") + n; });
      msg += n;
    }

    msg += "THIS MONTH EXPENSES" + n;
    msg += "Total spent: R" + expTotal.toFixed(0) + n + n;
    msg += "---" + n;
    msg += "Cape Parts Finder";

    const phone = settings.whatsapp_number;
    window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(msg));
  }

    async function saveEdit() {
    if (!editModal) return;
    setSavingEdit(true);
    await supabase.from("parts_requests").update({
      customer_name: editForm.customer_name,
      phone_number: editForm.phone_number,
      email: editForm.email,
      area: editForm.area,
      vehicle_make: editForm.vehicle_make,
      vehicle_model: editForm.vehicle_model,
      vehicle_year: editForm.vehicle_year,
      engine_size: editForm.engine_size,
      part_needed: editForm.part_needed,
      extra_details: editForm.extra_details,
    }).eq("id", editModal.id);
    setSavingEdit(false);
    setEditModal(null);
    fetchRequests();
  }

  async function saveQuickSale() {
    if (!quickSaleModal || !quickSalePrice) { alert("Please enter a selling price"); return; }
    setSavingQuickSale(true);
    const selling = parseFloat(quickSalePrice);
    const cost = parseFloat(quickSaleCost) || 0;
    const profit = selling - cost;
    const { error } = await supabase.from("sales").insert([{
      request_id: quickSaleModal.id,
      customer_name: quickSaleModal.customer_name,
      customer_phone: quickSaleModal.phone_number,
      selling_price: selling,
      supplier_price: cost,
      profit: profit,
      status: "Completed",
      notes: quickSaleModal.part_needed,
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

  const NAV_LINKS = [
    { label: "Requests", href: "/admin", active: true },
    { label: "Suppliers", href: "/suppliers" },
    { label: "Sales", href: "/sales" },
    { label: "Customers", href: "/customers" },
    { label: "Inventory", href: "/inventory" },
    { label: "Expenses", href: "/expenses" },
    { label: "Analytics", href: "/analytics" },
    { label: "Reminders", href: "/reminders", badge: reminderDueCount },
    { label: "Reviews", href: "/reviews-admin" },
  { label: "Watchlist", href: "/watchlist" },
    { label: "Settings", href: "/settings" },
  ];

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

  return (
    <main style={darkBg}>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* NAV */}
        <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", background: "rgba(17,17,17,0.85)", position: "sticky", top: 0, zIndex: 50 }}>
          <div className="max-w-7xl mx-auto px-3 h-14 flex items-center gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0" style={{ boxShadow: "0 0 16px rgba(249,115,22,0.35)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <span className="font-bold text-white text-[14px] hidden md:block">Cape Parts Finder</span>
            </div>

            {/* Nav links - scrollable */}
            <div className="flex gap-0.5 overflow-x-auto scrollbar-hide flex-1 mx-1">
              {NAV_LINKS.map((n) => (
                <a key={n.href} href={n.href}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] sm:text-[12px] no-underline transition font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1"
                  style={n.active ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" } : { color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }}>
                  {n.label}
                  {n.href === "/admin" && newCount > 0 && (
                    <span style={{ background: "#f97316", color: "white", borderRadius: 999, fontSize: 9, fontWeight: 700, padding: "1px 5px", lineHeight: "16px" }}>{newCount}</span>
                  )}
                  {n.badge && n.badge > 0 ? (
                    <span style={{ background: "#fbbf24", color: "#0a0a0a", borderRadius: 999, fontSize: 9, fontWeight: 700, padding: "1px 5px", lineHeight: "16px" }}>{n.badge}</span>
                  ) : null}
                </a>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={exportToCSV}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
              </button>
              <button onClick={fetchRequests}
                className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
              <button onClick={sendDailyReport}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition"
                style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366" }}
                title="Send daily report to WhatsApp">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Report
              </button>
              <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-5">

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
            <div className="flex gap-1.5 overflow-x-auto mt-3 pb-1 scrollbar-hide">
              {["All", ...STATUS_OPTIONS].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] transition cursor-pointer font-medium whitespace-nowrap flex-shrink-0"
                  style={statusFilter === s
                    ? { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.35)", color: "#fb923c" }
                    : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                  {s} {s === "All" ? `(${counts.All})` : `(${counts[s as keyof typeof counts] ?? 0})`}
                </button>
              ))}
            </div>
          </div>

          {/* BULK + ARCHIVE */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-2">
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
                <>
                  <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                    className="rounded-lg px-3 py-1.5 text-[12px] outline-none cursor-pointer text-white"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ background: "#1a1a1a" }}>{s}</option>)}
                  </select>
                  <button onClick={bulkUpdateStatus} disabled={bulkUpdating}
                    className="px-4 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition text-white"
                    style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", opacity: bulkUpdating ? 0.6 : 1 }}>
                    {bulkUpdating ? "Updating..." : `Update ${selectedIds.size}`}
                  </button>
                  <button onClick={() => setSelectedIds(new Set())}
                    className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer transition"
                    style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    Clear
                  </button>
                  <button onClick={() => { setBroadcastModal(true); setBroadcastMsg(""); setBroadcastDone(0); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition"
                    style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)", color: "#25D366" }}>
                    WhatsApp ({selectedIds.size})
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {counts.Closed > 0 && (
                <button onClick={() => setHideArchived(!hideArchived)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition"
                  style={hideArchived
                    ? { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
                    : { background: "rgba(107,114,128,0.12)", border: "1px solid rgba(107,114,128,0.25)", color: "#9ca3af" }}>
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
                <p className="text-gray-600 text-sm">{hideArchived && counts.Closed > 0 ? `No active requests · ${counts.Closed} archived` : "No requests found"}</p>
                {hideArchived && counts.Closed > 0 && (
                  <button onClick={() => setHideArchived(false)} className="mt-3 text-[12px] cursor-pointer transition" style={{ color: "#9ca3af" }}>Show archived →</button>
                )}
              </div>
            )}

            {filteredRequests.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((request) => {
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
                  <div className="px-3 py-3 flex items-center gap-2">
                    <div onClick={() => toggleSelect(request.id)}
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 cursor-pointer transition"
                      style={{ background: isSelected ? "#f97316" : "rgba(255,255,255,0.06)", border: isSelected ? "1px solid #f97316" : "1px solid rgba(255,255,255,0.15)" }}>
                      {isSelected && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold flex-shrink-0 text-orange-400" style={{ background: "rgba(249,115,22,0.12)" }}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : request.id)}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[13px] text-white">{request.customer_name}</span>
                        <span className="text-gray-500 text-[11px] truncate">{request.part_needed}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-gray-600">{new Date(request.created_at).toLocaleDateString("en-ZA")}</span>
                        <span className="text-[10px]" style={{ color: st.text }}>{request.status || "New"}</span>
                        {isStale && <span style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", borderRadius: 999, fontSize: 9, fontWeight: 700, padding: "1px 5px" }}>Follow up</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                        <span className="w-1 h-1 rounded-full" style={{ background: st.dot }} />
                        {request.status || "New"}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); setReminderModal(request); setReminderDate(""); setReminderTime(""); setReminderNote(""); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition flex-shrink-0"
                        style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : request.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.04)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="px-4 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-[12px]">
                        {[
                          { label: "Phone", value: request.phone_number },
                          { label: "Email", value: request.email },
                          { label: "Area", value: request.area },
                          { label: "Vehicle", value: `${request.vehicle_make} ${request.vehicle_model} ${request.vehicle_year}` },
                          { label: "VIN", value: request.vin_number },
                          { label: "Engine", value: request.engine_size },
                          { label: "Preference", value: request.part_preference },
                        ].map(({ label, value }) => value ? (
                          <div key={label}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</p>
                            <p className="text-gray-300 font-medium">{value}</p>
                          </div>
                        ) : null)}
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
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Photos ({allPhotos.length})</p>
                          <div className="flex gap-2 flex-wrap">
                            {allPhotos.map((url, i) => (
                              <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-24 h-20 object-cover rounded-xl cursor-pointer"
                                style={{ border: "1px solid rgba(255,255,255,0.08)" }} onClick={() => window.open(url)} />
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
                        <button onClick={() => { setEditModal(request); setEditForm({ customer_name: request.customer_name || "", phone_number: request.phone_number || "", email: request.email || "", area: request.area || "", vehicle_make: request.vehicle_make || "", vehicle_model: request.vehicle_model || "", vehicle_year: request.vehicle_year || "", engine_size: request.engine_size || "", part_needed: request.part_needed || "", extra_details: request.extra_details || "" }); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa" }}>
                          Edit Request
                        </button>
                        <button onClick={() => { setEditModal(request); setEditForm({ customer_name: request.customer_name || "", phone_number: request.phone_number || "", email: request.email || "", area: request.area || "", vehicle_make: request.vehicle_make || "", vehicle_model: request.vehicle_model || "", vehicle_year: request.vehicle_year || "", engine_size: request.engine_size || "", part_needed: request.part_needed || "", extra_details: request.extra_details || "" }); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa" }}>
                          Edit Request
                        </button>
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
                        <button onClick={() => { setQuickSaleModal(request); setQuickSalePrice(""); setQuickSaleCost(""); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>
                          Quick Sale
                        </button>
                        <button onClick={() => setTemplateModal(request)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366" }}>
                          WhatsApp
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

          {/* PAGINATION */}
          {filteredRequests.length > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-3 mt-4 pb-4">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-4 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: page === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)" }}>
                ← Previous
              </button>
              <span className="text-[12px] text-gray-500">
                Page {page + 1} of {Math.ceil(filteredRequests.length / PAGE_SIZE)} · {filteredRequests.length} total
              </span>
              <button onClick={() => setPage(p => Math.min(Math.ceil(filteredRequests.length / PAGE_SIZE) - 1, p + 1))}
                disabled={page >= Math.ceil(filteredRequests.length / PAGE_SIZE) - 1}
                className="px-4 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: page >= Math.ceil(filteredRequests.length / PAGE_SIZE) - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)" }}>
                Next →
              </button>
            </div>
          )}

        </div>
      </div>

      {/* REMINDER MODAL */}
      {reminderModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setReminderModal(null); }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "85vh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Set Callback Reminder</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{reminderModal.customer_name} · {reminderModal.phone_number}</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Date *</label>
                <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-3 text-[14px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Time *</label>
                <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
                  className="w-full rounded-xl px-3 py-3 text-[14px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Note (optional)</label>
                <textarea value={reminderNote} onChange={e => setReminderNote(e.target.value)}
                  placeholder="e.g. Follow up on brake pad quote..." rows={2}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-gray-300 resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              {reminderDate && reminderTime && (
                <div className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
                  <p className="text-[12px]" style={{ color: "#fbbf24" }}>
                    Reminder set for {new Date(reminderDate + "T" + reminderTime).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })} at {reminderTime}
                  </p>
                </div>
              )}
            </div>
            <div className="p-5 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", position: "sticky", bottom: 0, background: "#1a1a1a" }}>
              <button onClick={saveReminder} disabled={savingReminder}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold cursor-pointer transition text-white"
                style={{ background: savingReminder ? "rgba(251,191,36,0.4)" : "linear-gradient(135deg,#f59e0b,#d97706)", border: "none" }}>
                {savingReminder ? "Saving..." : "Save Reminder"}
              </button>
              <button onClick={() => setReminderModal(null)}
                className="px-5 py-3 rounded-xl text-[14px] font-medium cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST MODAL */}
      {broadcastModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setBroadcastModal(false); }}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "85vh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h2 className="font-bold text-[15px] text-white">WhatsApp Broadcast</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Sending to {selectedIds.size} customer{selectedIds.size > 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setBroadcastModal(false)} className="text-gray-500 text-lg cursor-pointer bg-transparent border-none">×</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Follow Up", msg: "Hi {name}, just checking in on your request for {part}. Can we help you?\n\nCape Parts Finder" },
                  { label: "Promotion", msg: "Hi {name}, Cape Parts Finder has great deals this week! Contact us for fast quotes.\n\nCape Parts Finder" },
                  { label: "Quote Ready", msg: "Hi {name}, we have a quote ready for {part}. Please reply for details.\n\nCape Parts Finder" },
                  { label: "Check In", msg: "Hi {name}, we are still sourcing {part} for you. Update coming soon.\n\nCape Parts Finder" },
                ].map(t => (
                  <button key={t.label} onClick={() => setBroadcastMsg(t.msg)}
                    className="px-3 py-2 rounded-lg text-[11px] font-medium cursor-pointer transition text-left"
                    style={{ background: broadcastMsg === t.msg ? "rgba(37,211,102,0.12)" : "rgba(255,255,255,0.04)", border: broadcastMsg === t.msg ? "1px solid rgba(37,211,102,0.3)" : "1px solid rgba(255,255,255,0.08)", color: broadcastMsg === t.msg ? "#25D366" : "rgba(255,255,255,0.6)" }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} rows={4}
                placeholder="Type your message... use {name} and {part}"
                className="w-full rounded-xl px-4 py-3 text-[13px] outline-none resize-none text-white placeholder-gray-600"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
              {broadcastSending && (
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)" }}>
                  <p className="text-[12px] font-medium" style={{ color: "#25D366" }}>Opening WhatsApp {broadcastDone} of {selectedIds.size}...</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={sendBroadcast} disabled={broadcastSending || !broadcastMsg.trim()}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition text-white"
                  style={{ background: broadcastMsg.trim() ? "linear-gradient(135deg, #25D366, #128C7E)" : "rgba(37,211,102,0.3)" }}>
                  {broadcastSending ? `Sending ${broadcastDone}/${selectedIds.size}...` : `Send to ${selectedIds.size}`}
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
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setTemplateModal(null); }}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "85vh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h2 className="font-bold text-[15px] text-white">WhatsApp Templates</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">To: {templateModal.customer_name} · {templateModal.phone_number}</p>
              </div>
              <button onClick={() => setTemplateModal(null)} className="text-gray-500 text-lg cursor-pointer bg-transparent border-none">×</button>
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
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setNotifyModal(null); }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "85vh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
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

      {/* REVIEW REQUEST MODAL */}
      {reviewModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setReviewModal(null); }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "85vh", overflowY: "auto", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-2xl mb-1">⭐</div>
              <h2 className="font-bold text-[15px] text-white">Request a Review</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{reviewModal.customer_name} just received their part — ask for a review!</p>
            </div>
            <div className="p-5">
              <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[12px] text-gray-300 leading-relaxed">
                  Hi {reviewModal.customer_name}, thank you for your order! We hope your {reviewModal.part_needed} is exactly what you needed. We would really appreciate if you could leave us a quick review: capepartsfinder.co.za/review - It only takes 30 seconds! Cape Parts Finder
                </p>
              </div>
              <div className="flex gap-2">
                <a href={"https://wa.me/" + (reviewModal.phone_number || "").replace(/\D/g, "") + "?text=" + encodeURIComponent("Hi " + (reviewModal.customer_name || "there") + ", thank you for your order! We hope your " + (reviewModal.part_needed || "part") + " is exactly what you needed. We would really appreciate if you could leave us a quick review: capepartsfinder.co.za/review - It only takes 30 seconds! Cape Parts Finder")}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setReviewModal(null)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold no-underline text-white"
                  style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  Send on WhatsApp
                </a>
                <button onClick={() => setReviewModal(null)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* EDIT REQUEST MODAL */}
      {editModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setEditModal(null); }}>
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Edit Request</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Fix any details on this request</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Customer Name", key: "customer_name" },
                  { label: "Phone Number", key: "phone_number" },
                  { label: "Email", key: "email" },
                  { label: "Area", key: "area" },
                  { label: "Vehicle Make", key: "vehicle_make" },
                  { label: "Vehicle Model", key: "vehicle_model" },
                  { label: "Vehicle Year", key: "vehicle_year" },
                  { label: "Engine Size", key: "engine_size" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] text-gray-500 mb-1 block">{f.label}</label>
                    <input value={editForm[f.key] || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Part Needed</label>
                <input value={editForm.part_needed || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, part_needed: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Extra Details</label>
                <textarea value={editForm.extra_details || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, extra_details: e.target.value }))}
                  rows={2} className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-2 pt-2" style={{ position: "sticky", bottom: 0, background: "#1a1a1a", paddingTop: 12 }}>
                <button onClick={saveEdit} disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: savingEdit ? "rgba(96,165,250,0.4)" : "linear-gradient(135deg,#3b82f6,#2563eb)", border: "none" }}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => setEditModal(null)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* EDIT REQUEST MODAL */}
      {editModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setEditModal(null); }}>
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Edit Request</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Fix any details on this request</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Customer Name", key: "customer_name" },
                  { label: "Phone Number", key: "phone_number" },
                  { label: "Email", key: "email" },
                  { label: "Area", key: "area" },
                  { label: "Vehicle Make", key: "vehicle_make" },
                  { label: "Vehicle Model", key: "vehicle_model" },
                  { label: "Vehicle Year", key: "vehicle_year" },
                  { label: "Engine Size", key: "engine_size" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] text-gray-500 mb-1 block">{f.label}</label>
                    <input value={editForm[f.key] || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Part Needed</label>
                <input value={editForm.part_needed || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, part_needed: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Extra Details</label>
                <textarea value={editForm.extra_details || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, extra_details: e.target.value }))}
                  rows={2} className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-2 pt-2" style={{ position: "sticky", bottom: 0, background: "#1a1a1a", paddingTop: 12 }}>
                <button onClick={saveEdit} disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: savingEdit ? "rgba(96,165,250,0.4)" : "linear-gradient(135deg,#3b82f6,#2563eb)", border: "none" }}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => setEditModal(null)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
}
