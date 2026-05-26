"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "", phone_number: "", email: "", area: "",
    vehicle_make: "", vehicle_model: "", vehicle_year: "",
    vin_number: "", engine_size: "", part_needed: "",
    part_preference: "aftermarket", extra_details: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.customer_name || !formData.phone_number || !formData.part_needed) {
      alert("Please fill in your name, phone number and the part you need.");
      return;
    }
    setLoading(true);
    let photo_url = "";
    try {
      if (photo) {
        const fileName = `${Date.now()}-${photo.name}`;
        const { error: uploadError } = await supabase.storage.from("parts-photos").upload(fileName, photo);
        if (!uploadError) {
          const { data } = supabase.storage.from("parts-photos").getPublicUrl(fileName);
          photo_url = data.publicUrl;
        }
      }
      const { error } = await supabase.from("parts_requests").insert([{ ...formData, photo_url }]);
      if (error) { alert("Something went wrong. Please try again."); setLoading(false); }
      else {
        try { await fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) }); } catch {}
        setSuccess(true);
      }
    } catch { alert("Something went wrong."); setLoading(false); }
  }

  const darkBg = { background: "#0a0a0a" };
  const glowBlobs = (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "-15%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", top: "40%", left: "40%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)" }} />
    </div>
  );

  const inputClass = "w-full rounded-xl px-4 py-3 text-[14px] outline-none transition text-white placeholder-gray-600 focus:placeholder-gray-500";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };
  const inputFocusStyle = "focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20";

  // SUCCESS
  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={darkBg}>
        {glowBlobs}
        <div className="text-center" style={{ position: "relative", zIndex: 1 }}>
          <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center mx-auto mb-6" style={{ boxShadow: "0 0 40px rgba(249,115,22,0.4)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-3">You're all set.</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            Request received for <span className="text-orange-400 font-semibold">{formData.part_needed}</span>. We'll WhatsApp you on <span className="text-white font-semibold">{formData.phone_number}</span> shortly.
          </p>
          <button onClick={() => { setSuccess(false); setShowForm(false); setFormData({ customer_name: "", phone_number: "", email: "", area: "", vehicle_make: "", vehicle_model: "", vehicle_year: "", vin_number: "", engine_size: "", part_needed: "", part_preference: "aftermarket", extra_details: "" }); setPhoto(null); }}
            className="text-orange-400 hover:text-orange-300 font-medium text-sm transition">Submit another →</button>
        </div>
      </main>
    );
  }

  // FORM
  if (showForm) {
    return (
      <main className="min-h-screen" style={darkBg}>
        {glowBlobs}
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* Form Nav */}
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", background: "rgba(10,10,10,0.8)", position: "sticky", top: 0, zIndex: 10 }}>
            <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
              <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition cursor-pointer bg-transparent border-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back
              </button>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center" style={{ boxShadow: "0 0 12px rgba(249,115,22,0.4)" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </div>
                <span className="font-bold text-white text-[14px]">Cape Parts Finder</span>
              </div>
              <div className="w-12" />
            </div>
          </div>

          <div className="max-w-lg mx-auto px-4 py-8 pb-20">
            <div className="mb-7">
              <h2 className="text-[28px] font-black text-white tracking-tight">Request a Part</h2>
              <p className="text-gray-500 text-sm mt-1">Fill in below — we'll WhatsApp you a quote fast.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Contact */}
              <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(249,115,22,0.8)" }}>Contact Info</p>
                <input name="customer_name" placeholder="Full Name *" value={formData.customer_name} onChange={handleChange} required
                  className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
                <input name="phone_number" placeholder="WhatsApp Number *" value={formData.phone_number} onChange={handleChange} required type="tel"
                  className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
                <div className="grid grid-cols-2 gap-2">
                  <input name="email" placeholder="Email (optional)" value={formData.email} onChange={handleChange} type="email"
                    className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
                  <input name="area" placeholder="Your Area" value={formData.area} onChange={handleChange}
                    className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
                </div>
              </div>

              {/* Vehicle */}
              <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(249,115,22,0.8)" }}>Vehicle</p>
                <div className="grid grid-cols-3 gap-2">
                  <input name="vehicle_make" placeholder="Make" value={formData.vehicle_make} onChange={handleChange}
                    className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
                  <input name="vehicle_model" placeholder="Model" value={formData.vehicle_model} onChange={handleChange}
                    className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
                  <input name="vehicle_year" placeholder="Year" value={formData.vehicle_year} onChange={handleChange} type="number"
                    className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input name="vin_number" placeholder="VIN Number" value={formData.vin_number} onChange={handleChange}
                    className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
                  <input name="engine_size" placeholder="Engine Size" value={formData.engine_size} onChange={handleChange}
                    className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
                </div>
              </div>

              {/* Part */}
              <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(249,115,22,0.8)" }}>Part Details</p>
                <input name="part_needed" placeholder="What part do you need? *" value={formData.part_needed} onChange={handleChange} required
                  className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
                <div>
                  <p className="text-[11px] text-gray-600 mb-2">Preference</p>
                  <div className="flex gap-2">
                    {[{ val: "aftermarket", label: "Aftermarket" }, { val: "original", label: "Original OEM" }, { val: "either", label: "Either" }].map((p) => (
                      <button key={p.val} type="button" onClick={() => setFormData({ ...formData, part_preference: p.val })}
                        className="flex-1 py-2.5 rounded-xl text-[12px] font-medium transition cursor-pointer"
                        style={formData.part_preference === p.val
                          ? { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", color: "#fb923c" }
                          : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#6b7280" }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea name="extra_details" placeholder="Extra details — colour, side, condition (optional)"
                  value={formData.extra_details} onChange={handleChange} rows={2}
                  className={`${inputClass} ${inputFocusStyle} resize-none`} style={inputStyle} />
                <div>
                  <p className="text-[11px] text-gray-600 mb-2">Photo (optional)</p>
                  <div onClick={() => document.getElementById("photo-input")?.click()}
                    className="rounded-xl p-4 cursor-pointer transition"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                    {photo ? (
                      <div className="flex items-center gap-3">
                        <img src={URL.createObjectURL(photo)} alt="Preview" className="w-11 h-11 object-cover rounded-lg" />
                        <div><p className="text-[13px] font-medium text-gray-300 truncate max-w-[180px]">{photo.name}</p><p className="text-[11px] text-gray-600">Tap to change</p></div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 text-gray-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span className="text-[13px]">Add a photo of the part</span>
                      </div>
                    )}
                  </div>
                  <input id="photo-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full text-white py-4 rounded-2xl font-bold text-[15px] transition cursor-pointer"
                style={{ background: loading ? "rgba(249,115,22,0.4)" : "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: loading ? "none" : "0 8px 32px rgba(249,115,22,0.3)" }}>
                {loading ? "Submitting..." : "Submit Request"}
              </button>
              <p className="text-center text-[11px] text-gray-600 pb-4">We'll reach out via WhatsApp with your quote</p>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // LANDING
  return (
    <main className="min-h-screen overflow-hidden" style={darkBg}>
      {glowBlobs}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Nav */}
        <nav className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center" style={{ boxShadow: "0 0 20px rgba(249,115,22,0.4)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <span className="font-bold text-white text-[15px] tracking-tight">Cape Parts Finder</span>
          </div>
          <a href="/login" className="text-[13px] text-gray-500 hover:text-gray-300 transition no-underline px-3.5 py-1.5 rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>Admin</a>
        </nav>

        {/* Hero */}
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-8 lg:pt-24">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold mb-8" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            Serving Cape Town · Fast Turnaround
          </div>
          <h1 className="text-[52px] lg:text-[72px] font-black leading-[1.0] tracking-tight mb-6 text-white">
            Find any car part<br />
            <span style={{ background: "linear-gradient(90deg, #f97316, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>fast in Cape Town.</span>
          </h1>
          <p className="text-gray-400 text-[17px] leading-relaxed max-w-xl mb-10">
            We source parts from our trusted supplier network and deliver a quote straight to your WhatsApp — no hassle, no runaround.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-16">
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 text-white px-7 py-4 rounded-xl font-bold text-[15px] transition cursor-pointer"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 8px 32px rgba(249,115,22,0.35)" }}>
              Request a Part
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <div className="flex items-center gap-2 text-[13px] text-gray-500 px-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Free · No commitment · Response within hours
            </div>
          </div>
          <div className="flex gap-8 pb-16" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {[{ num: "500+", label: "Parts sourced" }, { num: "9+", label: "Trusted suppliers" }, { num: "< 24hr", label: "Avg response" }].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-black text-white">{s.num}</div>
                <div className="text-[12px] text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-10" style={{ color: "rgba(255,255,255,0.3)" }}>How It Works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: "01", title: "Submit your request", desc: "Tell us the part and vehicle details. Takes under 2 minutes.", highlight: true },
              { num: "02", title: "We source it", desc: "Our team contacts our verified Cape Town suppliers to find the best price." },
              { num: "03", title: "Get quoted on WhatsApp", desc: "We send you a quote on WhatsApp. Confirm and we arrange delivery or collection." },
            ].map((s) => (
              <div key={s.num} className="rounded-2xl p-6" style={{ background: s.highlight ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${s.highlight ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                <div className="font-bold text-[12px] mb-4 font-mono" style={{ color: "#f97316" }}>{s.num}</div>
                <h3 className="font-bold text-white text-[16px] mb-2 leading-tight">{s.title}</h3>
                <p className="text-gray-500 text-[13px] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-10" style={{ color: "rgba(255,255,255,0.3)" }}>Why Choose Us</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "⚡", title: "Fast", desc: "Same-day quotes on most requests" },
              { icon: "🔧", title: "Any Make", desc: "Japanese, German, Korean & local" },
              { icon: "💬", title: "WhatsApp First", desc: "All communication on WhatsApp" },
              { icon: "✅", title: "Verified", desc: "Only trusted Cape Town suppliers" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-2xl mb-3">{item.icon}</div>
                <h4 className="font-bold text-white text-[13px] mb-1">{item.title}</h4>
                <p className="text-gray-500 text-[12px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <div className="rounded-3xl p-10 text-center" style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0.04) 100%)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <h2 className="text-[32px] font-black text-white mb-3 tracking-tight">Need a part? Let's find it.</h2>
            <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">Submit a request and we'll have a quote on your WhatsApp within hours.</p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 text-white px-7 py-3.5 rounded-xl font-semibold text-[14px] transition cursor-pointer"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 8px 32px rgba(249,115,22,0.3)" }}>
              Request a Part
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 px-6 text-center max-w-6xl mx-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>© 2025 Cape Parts Finder · Cape Town, South Africa</p>
        </div>
      </div>
    </main>
  );
}
