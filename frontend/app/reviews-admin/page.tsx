"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const darkBg = { minHeight: "100vh", background: "#0e0e0e", color: "white", overflowX: "hidden" as const };
const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };
const COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];
const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function ReviewsAdminPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      fetchReviews();
    });
  }, []);

  async function fetchReviews() {
    setLoading(true);
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  }

  async function setApproved(id: number, approved: boolean) {
    setUpdatingId(id);
    const { error } = await supabase.from("reviews").update({ approved }).eq("id", id);
    if (!error) setReviews(prev => prev.map(r => r.id === id ? { ...r, approved } : r));
    setUpdatingId(null);
  }

  async function deleteReview(id: number) {
    if (!window.confirm("Delete this review permanently? This cannot be undone.")) return;
    setUpdatingId(id);
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (!error) setReviews(prev => prev.filter(r => r.id !== id));
    setUpdatingId(null);
  }

  const pendingCount = reviews.filter(r => !r.approved).length;
  const visibleReviews = reviews.filter(r =>
    filter === "all" ? true : filter === "pending" ? !r.approved : r.approved
  );

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const dist = [1,2,3,4,5].map(n => ({ n, count: reviews.filter(r => r.rating === n).length }));

  function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(s => (
          <svg key={s} width={size} height={size} viewBox="0 0 24 24"
            fill={s <= rating ? COLORS[rating] : "none"}
            stroke={s <= rating ? COLORS[rating] : "rgba(255,255,255,0.15)"}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        ))}
      </div>
    );
  }

  function copyReviewLink() {
    navigator.clipboard.writeText("https://capepartsfinder.co.za/review");
    alert("Review link copied! Send it to customers after delivery.");
  }

  if (loading) return (
    <main style={darkBg} className="flex items-center justify-center">
      <div className="flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 20px" }}>
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <p className="text-gray-300 text-sm">Loading reviews...</p>
      </div>
    </main>
  );

  return (
    <main style={darkBg}>
      {/* NAV */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="max-w-4xl mx-auto px-3 h-14 flex items-center gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <span className="font-bold text-white text-[13px] hidden sm:block">CPF</span>
          </div>
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide flex-1 mx-1">
            {[
              { label: "Requests", href: "/admin" },
              { label: "Sales", href: "/sales" },
              { label: "Customers", href: "/customers" },
              { label: "Analytics", href: "/analytics" },
              { label: "Reviews", href: "/reviews-admin", active: true },
              { label: "Settings", href: "/settings" },
            ].map(n => (
              <a key={n.href} href={n.href}
                className="px-2.5 py-1.5 rounded-lg text-[11px] no-underline transition font-medium whitespace-nowrap flex-shrink-0"
                style={n.active ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" } : { color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }}>
                {n.label}
              </a>
            ))}
          </div>
          <button onClick={copyReviewLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition flex-shrink-0"
            style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>
            Copy Link
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5">

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Reviews", value: reviews.length, color: "#fb923c" },
            { label: "Avg Rating", value: avgRating > 0 ? avgRating.toFixed(1) + " ⭐" : "—", color: "#fbbf24" },
            { label: "5 Star", value: dist[4].count, color: "#4ade80" },
            { label: "Pending", value: pendingCount, color: pendingCount > 0 ? "#fbbf24" : "#4ade80" },
          ].map(s => (
            <div key={s.label} style={cardStyle} className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</div>
              <div className="text-[22px] font-black" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* RATING DISTRIBUTION */}
        {reviews.length > 0 && (
          <div style={cardStyle} className="p-5 mb-5">
            <div className="flex items-center gap-6">
              <div className="text-center flex-shrink-0">
                <div className="text-[48px] font-black" style={{ color: COLORS[Math.round(avgRating)] || "#fb923c" }}>{avgRating.toFixed(1)}</div>
                <Stars rating={Math.round(avgRating)} size={16} />
                <div className="text-[11px] text-gray-500 mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</div>
              </div>
              <div className="flex-1 space-y-2">
                {[5,4,3,2,1].map(n => (
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 w-3">{n}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill={COLORS[n]} stroke={COLORS[n]} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: reviews.length > 0 ? `${(dist[n-1].count / reviews.length) * 100}%` : "0%", background: COLORS[n] }} />
                    </div>
                    <span className="text-[11px] text-gray-500 w-4">{dist[n-1].count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SHARE LINK */}
        <div style={{ ...cardStyle, border: "1px solid rgba(249,115,22,0.2)", background: "rgba(249,115,22,0.04)" }} className="p-4 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold text-white text-[13px] mb-0.5">Send review link to customers</p>
              <p className="text-[12px] font-mono" style={{ color: "#fb923c" }}>capepartsfinder.co.za/review</p>
            </div>
            <div className="flex gap-2">
              <button onClick={copyReviewLink}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer"
                style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>
                Copy Link
              </button>
              <a href={"https://wa.me/?text=" + encodeURIComponent("Hi! Please leave us a review at: https://capepartsfinder.co.za/review — it only takes 30 seconds and helps us a lot! Cape Parts Finder")}
                target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium no-underline"
                style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366" }}>
                Share on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* FILTER TABS */}
        {reviews.length > 0 && (
          <div className="flex gap-2 mb-4">
            {([
              { key: "all", label: `All (${reviews.length})` },
              { key: "pending", label: `Pending (${pendingCount})` },
              { key: "approved", label: `Approved (${reviews.length - pendingCount})` },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition"
                style={filter === t.key
                  ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.25)" }
                  : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* REVIEWS LIST */}
        {reviews.length === 0 ? (
          <div style={cardStyle} className="p-12 text-center">
            <div className="text-4xl mb-3">⭐</div>
            <div className="text-white font-semibold mb-1">No reviews yet</div>
            <div className="text-gray-500 text-[13px]">Share the review link with customers after delivery</div>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleReviews.map(r => (
              <div key={r.id} style={{ ...cardStyle, opacity: r.approved ? 1 : 0.92, borderColor: r.approved ? "rgba(255,255,255,0.07)" : "rgba(251,191,36,0.25)" }} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[16px] font-black flex-shrink-0"
                    style={{ background: `${COLORS[r.rating]}20`, color: COLORS[r.rating] }}>
                    {(r.customer_name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-[14px]">{r.customer_name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${COLORS[r.rating]}15`, color: COLORS[r.rating], border: `1px solid ${COLORS[r.rating]}30` }}>{LABELS[r.rating]}</span>
                        {!r.approved && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>PENDING</span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-600">{new Date(r.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <Stars rating={r.rating} size={13} />
                    {r.part_sourced && <p className="text-[12px] text-gray-500 mt-1">Part: {r.part_sourced}</p>}
                    {r.comment && <p className="text-[13px] text-gray-300 mt-2 leading-relaxed">"{r.comment}"</p>}
                    <div className="flex gap-2 mt-3">
                      {r.approved ? (
                        <button onClick={() => setApproved(r.id, false)} disabled={updatingId === r.id}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          {updatingId === r.id ? "..." : "Hide from site"}
                        </button>
                      ) : (
                        <button onClick={() => setApproved(r.id, true)} disabled={updatingId === r.id}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                          style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}>
                          {updatingId === r.id ? "..." : "Approve → publish"}
                        </button>
                      )}
                      <button onClick={() => deleteReview(r.id)} disabled={updatingId === r.id}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                        style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
