"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const darkBg = { minHeight: "100vh", background: "#0e0e0e", color: "white" };
const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };

export default function RemindersPage() {
  const router = useRouter();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completing, setCompleting] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      fetchReminders();
    });
  }, []);

  async function fetchReminders() {
    setLoading(true);
    const { data } = await supabase
      .from("reminders")
      .select("*")
      .order("remind_at", { ascending: true });
    setReminders(data || []);
    setLoading(false);
  }

  async function markDone(id: number) {
    setCompleting(id);
    await supabase.from("reminders").update({ completed: true }).eq("id", id);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: true } : r));
    setCompleting(null);
  }

  async function deleteReminder(id: number) {
    await supabase.from("reminders").delete().eq("id", id);
    setReminders(prev => prev.filter(r => r.id !== id));
  }

  const now = new Date();
  const filtered = reminders.filter(r => showCompleted ? r.completed : !r.completed);
  const overdueCount = reminders.filter(r => !r.completed && new Date(r.remind_at) < now).length;
  const todayCount = reminders.filter(r => {
    if (r.completed) return false;
    const d = new Date(r.remind_at);
    return d.toDateString() === now.toDateString();
  }).length;
  const upcomingCount = reminders.filter(r => !r.completed && new Date(r.remind_at) >= now).length;

  function timeLabel(remind_at: string) {
    const d = new Date(remind_at);
    const diff = d.getTime() - now.getTime();
    const diffMins = Math.round(diff / 60000);
    if (diffMins < -1440) return `${Math.abs(Math.round(diffMins/1440))} days overdue`;
    if (diffMins < -60) return `${Math.abs(Math.round(diffMins/60))}h overdue`;
    if (diffMins < 0) return `${Math.abs(diffMins)}m overdue`;
    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffMins < 1440) return `in ${Math.round(diffMins/60)}h`;
    return `in ${Math.round(diffMins/1440)} days`;
  }

  function isOverdue(remind_at: string) {
    return new Date(remind_at) < now;
  }

  function isToday(remind_at: string) {
    return new Date(remind_at).toDateString() === now.toDateString();
  }

  if (loading) return (
    <main style={darkBg} className="flex items-center justify-center">
      <div className="flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 20px" }}>
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <p className="text-gray-300 text-sm">Loading reminders...</p>
      </div>
    </main>
  );

  return (
    <main style={darkBg}>
      {/* NAV */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <span className="font-bold text-white text-[14px] hidden sm:block">Cape Parts Finder</span>
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {[
              { label: "Requests", href: "/admin" },
              { label: "Suppliers", href: "/suppliers" },
              { label: "Sales", href: "/sales" }, { label: "Customers", href: "/customers" },
              { label: "Inventory", href: "/inventory" },
              { label: "Analytics", href: "/analytics" },
              { label: "Expenses", href: "/expenses" }, { label: "Reminders", href: "/reminders", active: true },
            ].map((n) => (
              <a key={n.href} href={n.href} className="px-3 py-1.5 rounded-lg text-[12px] no-underline transition font-medium whitespace-nowrap flex-shrink-0"
                style={n.active ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" } : { color: "rgba(255,255,255,0.4)", border: "1px solid transparent" }}>
                {n.label}
              </a>
            ))}
          </div>
          <button onClick={fetchReminders}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Overdue", value: overdueCount, color: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
            { label: "Due Today", value: todayCount, color: "#fb923c", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)" },
            { label: "Upcoming", value: upcomingCount, color: "#60a5fa", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-2xl" style={{ background: s.bg, border: "1px solid " + s.border }}>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</div>
              <div className="text-[28px] font-black" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* TOGGLE */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[15px] text-white">
            {showCompleted ? "Completed Reminders" : "Upcoming Callbacks"}
          </h2>
          <button onClick={() => setShowCompleted(!showCompleted)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition"
            style={showCompleted
              ? { background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
            {showCompleted ? "Show Upcoming" : `Show Completed (${reminders.filter(r => r.completed).length})`}
          </button>
        </div>

        {/* LIST */}
        {filtered.length === 0 ? (
          <div style={cardStyle} className="p-12 text-center">
            <div className="text-4xl mb-3">{showCompleted ? "✅" : "🔔"}</div>
            <div className="text-white font-semibold mb-1">{showCompleted ? "No completed reminders" : "No reminders set"}</div>
            <div className="text-gray-500 text-[13px]">
              {showCompleted ? "Completed callbacks will appear here" : "Set reminders from the Requests page using the 🔔 bell icon"}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(r => {
              const overdue = !r.completed && isOverdue(r.remind_at);
              const today = !r.completed && isToday(r.remind_at);
              return (
                <div key={r.id} style={{
                  ...cardStyle,
                  border: r.completed ? "1px solid rgba(255,255,255,0.04)" : overdue ? "1px solid rgba(239,68,68,0.3)" : today ? "1px solid rgba(249,115,22,0.25)" : "1px solid rgba(255,255,255,0.07)",
                  background: r.completed ? "rgba(255,255,255,0.01)" : overdue ? "rgba(239,68,68,0.04)" : today ? "rgba(249,115,22,0.04)" : "rgba(255,255,255,0.03)",
                  opacity: r.completed ? 0.5 : 1,
                }} className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: r.completed ? "rgba(255,255,255,0.04)" : overdue ? "rgba(239,68,68,0.12)" : today ? "rgba(249,115,22,0.12)" : "rgba(59,130,246,0.1)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={r.completed ? "rgba(255,255,255,0.2)" : overdue ? "#f87171" : today ? "#fb923c" : "#60a5fa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-white text-[14px]">{r.customer_name}</span>
                        {overdue && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>OVERDUE</span>}
                        {today && !overdue && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}>TODAY</span>}
                        {r.completed && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}>DONE</span>}
                      </div>
                      <div className="text-[12px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                        📞 {r.phone_number}
                        <span className="mx-2">·</span>
                        🕐 {new Date(r.remind_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} at {new Date(r.remind_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                        {!r.completed && <span className="ml-2" style={{ color: overdue ? "#f87171" : today ? "#fb923c" : "#60a5fa" }}>({timeLabel(r.remind_at)})</span>}
                      </div>
                      {r.note && <div className="text-[12px] px-3 py-1.5 rounded-lg mt-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>{r.note}</div>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!r.completed && (
                        <>
                          <a href={"https://wa.me/" + r.phone_number.replace(/\D/g, "") + "?text=" + encodeURIComponent("Hi " + r.customer_name + ", following up on your parts request. Have you had a chance to consider our quote?")}
                            target="_blank" rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition"
                            style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          </a>
                          <button onClick={() => markDone(r.id)} disabled={completing === r.id}
                            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition"
                            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </button>
                        </>
                      )}
                      <button onClick={() => deleteReminder(r.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition"
                        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
