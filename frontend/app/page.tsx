"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    customer_name: "", phone_number: "", email: "", area: "",
    vehicle_make: "", vehicle_model: "", vehicle_year: "",
    vin_number: "", engine_size: "", part_needed: "",
    part_preference: "", extra_details: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      if (error) {
        alert("Something went wrong. Please try again.");
      } else {
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
        } catch (emailErr) {
          console.error("Email failed:", emailErr);
        }
        setSuccess(true);
        setStep(1);
        setFormData({
          customer_name: "", phone_number: "", email: "", area: "",
          vehicle_make: "", vehicle_model: "", vehicle_year: "",
          vin_number: "", engine_size: "", part_needed: "",
          part_preference: "", extra_details: "",
        });
        setPhoto(null);
        setTimeout(() => setSuccess(false), 8000);
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error occurred.");
    }
    setLoading(false);
  }

  const inputClass = "w-full border border-gray-200 bg-white px-4 py-3 rounded-xl text-sm text-gray-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition placeholder-gray-400";

  return (
    <main className="min-h-screen bg-[#FAFAF9]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── NAV ── */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-orange-500 flex items-center justify-center flex-shrink-0">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-[15px] text-gray-900 leading-tight">Cape Parts Finder</div>
            <div className="text-[11px] text-gray-400">Cape Town Vehicle Parts</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Fast Response
          </span>
          <span>Free to Use</span>
          <span>Local Suppliers</span>
        </div>
        <a href="#request-form"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition no-underline">
          Find My Part
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gray-900 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #F97316 0%, transparent 50%), radial-gradient(circle at 80% 20%, #FB923C 0%, transparent 40%)" }} />
        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 text-orange-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Cape Town's Trusted Parts Network
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight tracking-tight">
            Find Any Car Part<br />
            <span className="text-orange-400">in Cape Town</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Submit your request once. We connect you with trusted local suppliers and get you the best price — fast.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              { icon: "✓", text: "Free to use" },
              { icon: "⚡", text: "Same day response" },
              { icon: "🛡", text: "Verified suppliers" },
              { icon: "📍", text: "Cape Town based" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full text-sm text-gray-200">
                <span>{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
          <a href="#request-form"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition no-underline shadow-lg shadow-orange-500/30">
            Submit Parts Request
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">How It Works</h2>
            <p className="text-gray-400 text-sm mt-2">Simple, fast, and completely free</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, title: "Submit Request", desc: "Fill in your vehicle and part details. Takes less than 2 minutes." },
              { step: "02", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, title: "We Find Suppliers", desc: "We search our network of trusted Cape Town parts suppliers for you." },
              { step: "03", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>, title: "Get Your Quote", desc: "We contact you via WhatsApp with the best price and availability." },
            ].map((item, i) => (
              <div key={i} className="relative bg-[#FAFAF9] border border-gray-100 rounded-2xl p-6">
                <div className="absolute top-4 right-4 text-[11px] font-bold text-gray-200">{item.step}</div>
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="py-10 px-6 bg-orange-500">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { value: "500+", label: "Parts Sourced" },
            { value: "9+", label: "Trusted Suppliers" },
            { value: "Same Day", label: "Response Time" },
            { value: "100%", label: "Free Service" },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-orange-100 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORM SECTION ── */}
      <section id="request-form" className="py-16 px-6 bg-[#FAFAF9]">
        <div className="max-w-3xl mx-auto">

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Submit Your Parts Request</h2>
            <p className="text-gray-400 text-sm mt-2">Fill in the form and we will find your part fast</p>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-5 rounded-2xl mb-6 text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-bold text-lg">Request Submitted!</div>
              <div className="text-sm mt-1 text-green-600">We will contact you via WhatsApp shortly with the best price.</div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

            {/* Step indicator */}
            <div className="flex border-b border-gray-100">
              {[{ num: 1, label: "Your Details" }, { num: 2, label: "Vehicle Info" }, { num: 3, label: "Part Details" }].map((s) => (
                <button key={s.num} onClick={() => setStep(s.num)}
                  className={`flex-1 py-3.5 text-sm font-medium transition cursor-pointer border-none ${
                    step === s.num
                      ? "bg-orange-50 text-orange-600 border-b-2 border-orange-500"
                      : "bg-white text-gray-400 hover:text-gray-600"
                  }`}>
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-1.5 ${step === s.num ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {s.num}
                  </span>
                  {s.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              {/* Step 1 — Your Details */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Full Name *</label>
                      <input type="text" name="customer_name" placeholder="e.g. John Smith"
                        value={formData.customer_name} onChange={handleChange}
                        className={inputClass} required />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Phone Number *</label>
                      <input type="text" name="phone_number" placeholder="e.g. 071 234 5678"
                        value={formData.phone_number} onChange={handleChange}
                        className={inputClass} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Email Address</label>
                      <input type="email" name="email" placeholder="e.g. john@email.com"
                        value={formData.email} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Area in Cape Town</label>
                      <input type="text" name="area" placeholder="e.g. Bellville, Parow..."
                        value={formData.area} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                  <button type="button" onClick={() => setStep(2)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-semibold text-sm transition cursor-pointer mt-2">
                    Next: Vehicle Info →
                  </button>
                </div>
              )}

              {/* Step 2 — Vehicle Info */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Make</label>
                      <input type="text" name="vehicle_make" placeholder="e.g. Toyota"
                        value={formData.vehicle_make} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Model</label>
                      <input type="text" name="vehicle_model" placeholder="e.g. Corolla"
                        value={formData.vehicle_model} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Year</label>
                      <input type="text" name="vehicle_year" placeholder="e.g. 2018"
                        value={formData.vehicle_year} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">VIN Number</label>
                      <input type="text" name="vin_number" placeholder="Optional"
                        value={formData.vin_number} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Engine Size</label>
                      <input type="text" name="engine_size" placeholder="e.g. 1.6, 2.0"
                        value={formData.engine_size} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold text-sm transition cursor-pointer">
                      ← Back
                    </button>
                    <button type="button" onClick={() => setStep(3)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-semibold text-sm transition cursor-pointer">
                      Next: Part Details →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — Part Details */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Part Needed *</label>
                    <input type="text" name="part_needed" placeholder="e.g. Front brake pads, alternator, headlight..."
                      value={formData.part_needed} onChange={handleChange} className={inputClass} required />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Part Preference</label>
                    <select name="part_preference" value={formData.part_preference} onChange={handleChange} className={inputClass}>
                      <option value="">Select preference (optional)</option>
                      <option>Quality Aftermarket Part</option>
                      <option>OEM Equivalent Aftermarket Part</option>
                      <option>Cheapest Reliable Option</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Extra Details</label>
                    <textarea name="extra_details" placeholder="Any additional info that might help us find the right part..."
                      value={formData.extra_details} onChange={handleChange}
                      className={`${inputClass} h-24 resize-none`} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Upload Photo (optional)</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-orange-300 transition cursor-pointer"
                      onClick={() => document.getElementById("photo-upload")?.click()}>
                      {photo ? (
                        <div className="flex items-center justify-center gap-3">
                          <img src={URL.createObjectURL(photo)} alt="Preview" className="w-14 h-14 object-cover rounded-lg" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-700">{photo.name}</p>
                            <p className="text-[12px] text-gray-400">Click to change</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-gray-400">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <span className="text-sm">Click to upload a photo of the part or damage</span>
                        </div>
                      )}
                    </div>
                    <input id="photo-upload" type="file" accept="image/*" className="hidden"
                      onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(2)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold text-sm transition cursor-pointer">
                      ← Back
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3.5 rounded-xl font-bold text-sm transition cursor-pointer">
                      {loading ? "Submitting..." : "Submit Parts Request ✓"}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>

          <p className="text-center text-gray-400 text-xs mt-4">
            We typically respond within 1–2 hours during business hours · Cape Town, South Africa
          </p>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center tracking-tight mb-10">Why Cape Parts Finder?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: "⚡", title: "Fast Response", desc: "We typically respond within 1–2 hours with the best available price from our supplier network." },
              { icon: "🛡", title: "Trusted Suppliers", desc: "All our suppliers are vetted and based in Cape Town. No scams, no middlemen markup surprises." },
              { icon: "💰", title: "Best Price", desc: "We source from multiple suppliers to get you the most competitive price on quality parts." },
              { icon: "📱", title: "WhatsApp Updates", desc: "Get real-time updates via WhatsApp at every step — from sourcing to delivery confirmation." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 bg-[#FAFAF9] border border-gray-100 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-white text-sm">Cape Parts Finder</div>
              <div className="text-xs text-gray-500">Cape Town, South Africa</div>
            </div>
          </div>
          <div className="text-sm text-center">Fast. Reliable. Local.</div>
          <div className="text-xs">© 2026 Cape Parts Finder</div>
        </div>
      </footer>

    </main>
  );
}
