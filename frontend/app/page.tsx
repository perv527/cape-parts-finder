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

  const darkBg = { background: "#111111" };

  const glowBlobs = (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "-15%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", top: "40%", left: "40%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)" }} />
    </div>
  );

  const mountain = (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 0, opacity: 0.35, pointerEvents: "none" }}>
      <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet" style={{ width: "100%", display: "block" }}>
        <defs>
          <linearGradient id="mtnGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(249,115,22,0.09)" />
            <stop offset="100%" stopColor="rgba(249,115,22,0.01)" />
          </linearGradient>
        </defs>
        <path d="M0,320 L0,220 Q40,215 70,210 Q110,204 140,198 Q170,192 195,186 Q220,180 240,174 Q260,168 278,160 Q296,152 310,146 Q324,140 335,136 Q346,132 354,129 Q362,126 368,124 Q374,122 379,120 Q384,118 388,117 Q392,116 395,115 Q398,114 401,113 Q404,112 408,112 Q412,112 416,112 Q440,112 480,112 Q520,112 560,112 Q600,112 640,112 Q680,112 720,112 Q760,112 800,112 Q840,112 880,112 Q910,112 930,113 Q950,114 960,116 Q970,118 978,120 Q986,122 992,124 Q998,126 1003,128 Q1008,130 1014,133 Q1020,136 1028,140 Q1036,144 1046,150 Q1056,156 1068,163 Q1080,170 1095,177 Q1110,184 1128,190 Q1146,196 1165,202 Q1184,208 1205,213 Q1226,218 1250,223 Q1290,230 1330,236 Q1370,242 1410,247 Q1430,249 1440,251 L1440,320 Z" fill="url(#mtnGrad)" />
      </svg>
    </div>
  );

  const waButton = (
    <a href="https://wa.me/27696863952?text=Hi%20Cape%20Parts%20Finder%2C%20I%20need%20help%20finding%20a%20car%20part." target="_blank"
      style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 999, width: "56px", height: "56px", borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(37,211,102,0.45)", textDecoration: "none" }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    </a>
  );

  const inputClass = "w-full rounded-xl px-4 py-3 text-[14px] outline-none transition text-white placeholder-gray-600";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={darkBg}>
        {glowBlobs}
        {waButton}
        <div className="text-center" style={{ position: "relative", zIndex: 1 }}>
          <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center mx-auto mb-6" style={{ boxShadow: "0 0 40px rgba(249,115,22,0.4)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-3">You're all set.</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            Request received for <span className="text-orange-400 font-semibold">{formData.part_needed}</span>. We'll WhatsApp you on <span className="text-white font-semibold">{formData.phone_number}</span> shortly.
          </p>
          <button onClick={() => { setSuccess(false); setShowForm(false); setFormData({ customer_name: "", phone_number: "", email: "", area: "", vehicle_make: "", vehicle_model: "", vehicle_year: "", vin_number: "", engine_size: "", part_needed: "", part_preference: "aftermarket", extra_details: "" }); setPhoto(null); }}
            className="text-orange-400 hover:text-orange-300 font-medium text-sm transition">
            Submit another →
          </button>
        </div>
      </main>
    );
  }

  if (showForm) {
    return (
      <main className="min-h-screen" style={darkBg}>
        {glowBlobs}
        {waButton}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", background: "rgba(17,17,17,0.85)", position: "sticky", top: 0, zIndex: 10 }}>
            <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
              <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition cursor-pointer bg-transparent border-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                Back
              </button>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center" style={{ boxShadow: "0 0 12px rgba(249,115,22,0.4)" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
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
              <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(249,115,22,0.8)" }}>Contact Info</p>
                <input name="customer_name" placeholder="Full Name *" value={formData.customer_name} onChange={handleChange} required className={inputClass} style={inputStyle} />
                <input name="phone_number" placeholder="WhatsApp Number *" value={formData.phone_number} onChange={handleChange} required type="tel" className={inputClass} style={inputStyle} />
                <div className="grid grid-cols-2 gap-2">
                  <input name="email" placeholder="Email (optional)" value={formData.email} onChange={handleChange} type="email" className={inputClass} style={inputStyle} />
                  <input name="area" placeholder="Your Area" value={formData.area} onChange={handleChange} className={inputClass} style={inputStyle} />
                </div>
              </div>
              <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(249,115,22,0.8)" }}>Vehicle</p>
                <div className="grid grid-cols-3 gap-2">
                  <input name="vehicle_make" placeholder="Make" value={formData.vehicle_make} onChange={handleChange} className={inputClass} style={inputStyle} />
                  <input name="vehicle_model" placeholder="Model" value={formData.vehicle_model} onChange={handleChange} className={inputClass} style={inputStyle} />
                  <input name="vehicle_year" placeholder="Year" value={formData.vehicle_year} onChange={handleChange} type="number" className={inputClass} style={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input name="vin_number" placeholder="VIN Number" value={formData.vin_number} onChange={handleChange} className={inputClass} style={inputStyle} />
                  <input name="engine_size" placeholder="Engine Size" value={formData.engine_size} onChange={handleChange} className={inputClass} style={inputStyle} />
                </div>
              </div>
              <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(249,115,22,0.8)" }}>Part Details</p>
                <input name="part_needed" placeholder="What part do you need? *" value={formData.part_needed} onChange={handleChange} required className={inputClass} style={inputStyle} />
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
                <textarea name="extra_details" placeholder="Extra details — colour, side, condition (optional)" value={formData.extra_details} onChange={handleChange} rows={2}
                  className={`${inputClass} resize-none`} style={inputStyle} />
                <div>
                  <p className="text-[11px] text-gray-600 mb-2">Photo (optional)</p>
                  <div onClick={() => document.getElementById("photo-input")?.click()} className="rounded-xl p-4 cursor-pointer transition"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                    {photo ? (
                      <div className="flex items-center gap-3">
                        <img src={URL.createObjectURL(photo)} alt="Preview" className="w-11 h-11 object-cover rounded-lg" />
                        <div><p className="text-[13px] font-medium text-gray-300 truncate max-w-[180px]">{photo.name}</p><p className="text-[11px] text-gray-600">Tap to change</p></div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 text-gray-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        <span className="text-[13px]">Add a photo of the part</span>
                      </div>
                    )}
                  </div>
                  <input id="photo-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full text-white py-4 rounded-2xl font-bold text-[15px] transition cursor-pointer"
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

  return (
    <main className="min-h-screen overflow-hidden" style={{ ...darkBg, position: "relative" }}>
      {glowBlobs}
      {mountain}
      {waButton}
      <div style={{ position: "relative", zIndex: 1 }}>
        <nav className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center" style={{ boxShadow: "0 0 20px rgba(249,115,22,0.35)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
            </div>
            <span className="font-bold text-white text-[15px] tracking-tight">Cape Parts Finder</span>
          </div>
          <a href="/track" className="text-[12px] text-gray-500 hover:text-orange-400 transition no-underline">Track my request →</a>
        </nav>

        <div className="max-w-6xl mx-auto px-6 pt-16 pb-8 lg:pt-24">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold mb-8" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)", color: "#fb923c" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            Serving Cape Town · Fast Turnaround
          </div>
          <h1 className="text-[52px] lg:text-[72px] font-black leading-[1.0] tracking-tight mb-6 text-white">
            Find any car part<br />
            <span style={{ background: "linear-gradient(90deg, #f97316, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              fast in Cape Town.
            </span>
          </h1>
          <p className="text-gray-400 text-[17px] leading-relaxed max-w-xl mb-10">
            We source parts from our trusted supplier network and deliver a quote straight to your WhatsApp — no hassle, no runaround.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-16">
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 text-white px-7 py-4 rounded-xl font-bold text-[15px] transition cursor-pointer"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 8px 28px rgba(249,115,22,0.30)" }}>
              Request a Part
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
            <a href="/track" className="inline-flex items-center gap-2 text-[13px] text-gray-500 hover:text-orange-400 transition no-underline px-2 py-4">
              Track existing request →
            </a>
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

        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-10" style={{ color: "rgba(255,255,255,0.25)" }}>How It Works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: "01", title: "Submit your request", desc: "Tell us the part and vehicle details. Takes under 2 minutes.", highlight: true },
              { num: "02", title: "We source it", desc: "Our team contacts our verified Cape Town suppliers to find the best price." },
              { num: "03", title: "Get quoted on WhatsApp", desc: "We send you a quote on WhatsApp. Confirm and we arrange delivery or collection." },
            ].map((s) => (
              <div key={s.num} className="rounded-2xl p-6" style={{ background: s.highlight ? "rgba(249,115,22,0.06)" : "rgba(255,255,255,0.025)", border: `1px solid ${s.highlight ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.05)"}` }}>
                <div className="font-bold text-[12px] mb-4 font-mono" style={{ color: "#f97316" }}>{s.num}</div>
                <h3 className="font-bold text-white text-[16px] mb-2 leading-tight">{s.title}</h3>
                <p className="text-gray-500 text-[13px] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-16">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-10" style={{ color: "rgba(255,255,255,0.25)" }}>Why Choose Us</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "⚡", title: "Fast", desc: "Same-day quotes on most requests" },
              { icon: "🔧", title: "Any Make", desc: "Japanese, German, Korean & local" },
              { icon: "💬", title: "WhatsApp First", desc: "All communication on WhatsApp" },
              { icon: "✅", title: "Verified", desc: "Only trusted Cape Town suppliers" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-2xl mb-3">{item.icon}</div>
                <h4 className="font-bold text-white text-[13px] mb-1">{item.title}</h4>
                <p className="text-gray-500 text-[12px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-16">
          <div className="rounded-3xl p-10 text-center" style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.09) 0%, rgba(249,115,22,0.03) 100%)", border: "1px solid rgba(249,115,22,0.15)" }}>
            <h2 className="text-[32px] font-black text-white mb-3 tracking-tight">Need a part? Let's find it.</h2>
            <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">Submit a request and we'll have a quote on your WhatsApp within hours.</p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 text-white px-7 py-3.5 rounded-xl font-semibold text-[14px] transition cursor-pointer"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 8px 28px rgba(249,115,22,0.28)" }}>
              Request a Part
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          </div>
        </div>

        <div className="py-6 px-6 text-center max-w-6xl mx-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <a href="/track" className="text-gray-600 hover:text-orange-400 text-[11px] transition no-underline block mb-2">Track my request →</a>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>© 2025 Cape Parts Finder · Cape Town, South Africa</p>
        </div>
      </div>
    </main>
  );
}
