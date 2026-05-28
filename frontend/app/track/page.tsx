"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const STATUS_INFO: Record<string, { label: string; desc: string; color: string; icon: string }> = {
  New:       { label: "Request Received",    desc: "We've received your request and will start searching shortly.",        color: "#f97316", icon: "📋" },
  Searching: { label: "Searching for Part",  desc: "We're actively contacting our supplier network to find your part.",    color: "#3b82f6", icon: "🔍" },
  Quoted:    { label: "Quote Ready",         desc: "We found your part! Check your WhatsApp for the price details.",       color: "#22c55e", icon: "💬" },
  Ordered:   { label: "Part Ordered",        desc: "Great news! Your part has been ordered and is on its way.",            color: "#a855f7", icon: "📦" },
  Delivered: { label: "Part Delivered",      desc: "Your part has been delivered. Thank you for using Cape Parts Finder!", color: "#14b8a6", icon: "✅" },
  Closed:    { label: "Request Closed",      desc: "This request has been completed. Thank you for your business!",        color: "#6b7280", icon: "🏁" },
};

const STEPS = ["New", "Searching", "Quoted", "Ordered", "Delivered"];

export default function TrackPage() {
  const [phone, setPhone] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setSearched(false);

    // Normalize phone — try with and without country code
    const cleaned = phone.replace(/\D/g, "");
    const variants = [cleaned, "27" + cleaned.replace(/^0/, ""), "0" + cleaned.replace(/^27/, "")];

    const { data } = await supabase
      .from("parts_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const matched = (data || []).filter(r => {
      const rCleaned = (r.phone_number || "").replace(/\D/g, "");
      return variants.some(v => rCleaned === v || rCleaned.endsWith(v) || v.endsWith(rCleaned));
    });

    setRequests(matched);
    setSearched(true);
    setLoading(false);
  }

  const darkBg = { background: "#111111", minHeight: "100vh" };
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };

  return (
    <main style={darkBg}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "-15%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Nav */}
        <nav className="px-6 py-4 flex items-center justify-between max-w-2xl mx-auto">
          <a href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center" style={{ boxShadow: "0 0 16px rgba(249,115,22,0.35)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <span className="font-bold text-white text-[14px]">Cape Parts Finder</span>
          </a>
          <a href="/" className="text-[13px] text-gray-500 hover:text-gray-300 transition no-underline">← Back</a>
        </nav>

        <div className="max-w-2xl mx-auto px-5 py-8">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)" }}>
              🔍
            </div>
            <h1 className="text-[28px] font-black text-white tracking-tight mb-2">Track Your Request</h1>
            <p className="text-gray-500 text-sm">Enter your WhatsApp number to see your request status</p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-8">
            <input type="tel" placeholder="Your WhatsApp number e.g. 0821234567" value={phone} onChange={e => setPhone(e.target.value)} required
              className="flex-1 rounded-xl px-4 py-3 text-[14px] outline-none text-white placeholder-gray-600"
              style={inputStyle} />
            <button type="submit" disabled={loading}
              className="px-5 py-3 rounded-xl font-bold text-[14px] text-white cursor-pointer transition flex-shrink-0"
              style={{ background: loading ? "rgba(249,115,22,0.4)" : "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: loading ? "none" : "0 4px 16px rgba(249,115,22,0.3)" }}>
              {loading ? "..." : "Track"}
            </button>
          </form>

          {/* Results */}
          {searched && requests.length === 0 && (
            <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-3xl mb-3">😕</div>
              <h3 className="font-bold text-white mb-2">No requests found</h3>
              <p className="text-gray-500 text-sm">We couldn't find any requests for that number. Try a different format or <a href="/" className="text-orange-400 hover:text-orange-300">submit a new request</a>.</p>
            </div>
          )}

          <div className="space-y-4">
            {requests.map((req) => {
              const status = req.status || "New";
              const info = STATUS_INFO[status] || STATUS_INFO.New;
              const stepIndex = STEPS.indexOf(status);

              return (
                <div key={req.id} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>

                  {/* Header */}
                  <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white text-[15px]">{req.part_needed || "Part Request"}</h3>
                        <p className="text-gray-500 text-[12px] mt-0.5">
                          {req.vehicle_year} {req.vehicle_make} {req.vehicle_model}
                          {" · "}{new Date(req.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-2xl">{info.icon}</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="px-5 py-4">
                    <div className="rounded-xl p-4 mb-4" style={{ background: `${info.color}12`, border: `1px solid ${info.color}25` }}>
                      <p className="font-bold text-[14px] mb-1" style={{ color: info.color }}>{info.label}</p>
                      <p className="text-gray-400 text-[12px] leading-relaxed">{info.desc}</p>
                    </div>

                    {/* Progress bar */}
                    {status !== "Closed" && (
                      <div className="mb-4">
                        <div className="flex justify-between mb-2">
                          {STEPS.map((step, i) => (
                            <div key={step} className="flex flex-col items-center gap-1 flex-1">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                                style={i <= stepIndex
                                  ? { background: info.color, color: "white" }
                                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" }}>
                                {i < stepIndex ? "✓" : i + 1}
                              </div>
                              <span className="text-[8px] text-center hidden sm:block" style={{ color: i <= stepIndex ? info.color : "rgba(255,255,255,0.2)" }}>
                                {step === "New" ? "Received" : step === "Searching" ? "Searching" : step === "Quoted" ? "Quoted" : step === "Ordered" ? "Ordered" : "Delivered"}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(((stepIndex) / (STEPS.length - 1)) * 100, 5)}%`, background: info.color }} />
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {req.part_preference && (
                        <div>
                          <p style={{ color: "rgba(255,255,255,0.25)" }} className="font-bold uppercase tracking-widest mb-0.5">Preference</p>
                          <p className="text-gray-400 capitalize">{req.part_preference}</p>
                        </div>
                      )}
                      {req.area && (
                        <div>
                          <p style={{ color: "rgba(255,255,255,0.25)" }} className="font-bold uppercase tracking-widest mb-0.5">Area</p>
                          <p className="text-gray-400">{req.area}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp CTA */}
                  <div className="px-5 pb-4">
                    <a href={`https://wa.me/27696863952?text=Hi%20Cape%20Parts%20Finder%2C%20I%27m%20following%20up%20on%20my%20request%20for%20${encodeURIComponent(req.part_needed || "a part")}`}
                      target="_blank"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-medium no-underline transition"
                      style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                      Follow up on WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit new */}
          {searched && (
            <div className="text-center mt-8">
              <a href="/" className="text-orange-400 hover:text-orange-300 text-sm font-medium transition no-underline">
                Submit a new request →
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
