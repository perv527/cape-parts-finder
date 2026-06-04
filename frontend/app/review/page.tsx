"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ReviewPage() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [form, setForm] = useState({ customer_name: "", phone_number: "", comment: "", part_sourced: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!rating) { setError("Please select a star rating"); return; }
    if (!form.customer_name.trim()) { setError("Please enter your name"); return; }
    setError("");
    setLoading(true);
    const { error: err } = await supabase.from("reviews").insert([{
      customer_name: form.customer_name.trim(),
      phone_number: form.phone_number.trim() || null,
      rating,
      comment: form.comment.trim() || null,
      part_sourced: form.part_sourced.trim() || null,
    }]);
    if (err) { setError("Something went wrong. Please try again."); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  }

  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

  if (success) return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a" }} className="flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.1))", border: "2px solid rgba(34,197,94,0.4)" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="text-[28px] font-black text-white mb-3">Thank You!</h2>
        <p className="text-gray-400 text-[15px] leading-relaxed mb-6">
          Your review has been submitted. We really appreciate your feedback — it helps us improve our service.
        </p>
        <div className="flex justify-center gap-1 mb-4">
          {[1,2,3,4,5].map(s => (
            <svg key={s} width="32" height="32" viewBox="0 0 24 24" fill={s <= rating ? colors[rating] : "none"} stroke={s <= rating ? colors[rating] : "rgba(255,255,255,0.2)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          ))}
        </div>
        <p className="font-bold text-[18px]" style={{ color: colors[rating] }}>{labels[rating]}</p>
        <p className="text-gray-600 text-[12px] mt-4">Cape Parts Finder · Cape Town</p>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", overflowX: "hidden" as const }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.07) 0%,transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* NAV */}
        <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,10,0.8)", backdropFilter: "blur(12px)" }}>
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 0 20px rgba(249,115,22,0.4)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div>
                <div className="font-black text-white text-[15px] leading-none">Cape Parts Finder</div>
                <div className="text-[10px] text-orange-400/70 leading-none mt-0.5">Leave a Review</div>
              </div>
            </div>
            <a href="/" className="text-[12px] no-underline" style={{ color: "rgba(255,255,255,0.4)" }}>← Back</a>
          </div>
        </nav>

        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[28px] font-black text-white mb-2">How was your experience?</h1>
            <p className="text-gray-400 text-[14px]">Your feedback helps us serve Cape Town better</p>
          </div>

          {/* Star Rating */}
          <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[12px] text-gray-500 uppercase tracking-wider mb-4">Tap to rate</p>
            <div className="flex justify-center gap-2 mb-3">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  className="cursor-pointer transition-all"
                  style={{ background: "none", border: "none", transform: (hover || rating) >= s ? "scale(1.2)" : "scale(1)" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24"
                    fill={(hover || rating) >= s ? colors[hover || rating] : "none"}
                    stroke={(hover || rating) >= s ? colors[hover || rating] : "rgba(255,255,255,0.2)"}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              ))}
            </div>
            {(hover || rating) > 0 && (
              <p className="font-bold text-[18px] transition-all" style={{ color: colors[hover || rating] }}>
                {labels[hover || rating]}
              </p>
            )}
          </div>

          {/* Form */}
          <div className="rounded-2xl p-5 space-y-4 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Your Name *</label>
              <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                placeholder="e.g. John Smith"
                className="w-full rounded-xl px-4 py-3 text-[14px] outline-none text-white placeholder-gray-600"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Phone Number (optional)</label>
              <input value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                placeholder="e.g. 082 123 4567" type="tel"
                className="w-full rounded-xl px-4 py-3 text-[14px] outline-none text-white placeholder-gray-600"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Part You Ordered (optional)</label>
              <input value={form.part_sourced} onChange={e => setForm(f => ({ ...f, part_sourced: e.target.value }))}
                placeholder="e.g. Brake pads, alternator"
                className="w-full rounded-xl px-4 py-3 text-[14px] outline-none text-white placeholder-gray-600"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Your Comment (optional)</label>
              <textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Tell us about your experience..."
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-[14px] outline-none text-white placeholder-gray-600 resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
          </div>

          {error && <p className="text-[13px] text-red-400 text-center mb-3">{error}</p>}

          <button onClick={handleSubmit} disabled={loading || !rating}
            className="w-full py-4 rounded-2xl text-[15px] font-bold cursor-pointer transition text-white"
            style={{ background: !rating ? "rgba(249,115,22,0.3)" : loading ? "rgba(249,115,22,0.5)" : "linear-gradient(135deg,#f97316,#ea580c)", border: "none", boxShadow: rating ? "0 4px 20px rgba(249,115,22,0.3)" : "none" }}>
            {loading ? "Submitting..." : "Submit Review ⭐"}
          </button>

          <p className="text-center text-gray-600 text-[12px] mt-4">Cape Parts Finder · Cape Town & Surrounds</p>
        </div>
      </div>
    </main>
  );
}
