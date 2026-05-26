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
      if (error) {
        alert("Something went wrong. Please try again.");
        setLoading(false);
      } else {
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
        } catch (e) { console.error(e); }
        setSuccess(true);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // SUCCESS
  if (success) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">You're all set.</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            We got your request for a <strong className="text-gray-700">{formData.part_needed}</strong>. Expect a WhatsApp message on <strong className="text-gray-700">{formData.phone_number}</strong> soon.
          </p>
          <button onClick={() => {
            setSuccess(false); setShowForm(false);
            setFormData({ customer_name: "", phone_number: "", email: "", area: "", vehicle_make: "", vehicle_model: "", vehicle_year: "", vin_number: "", engine_size: "", part_needed: "", part_preference: "aftermarket", extra_details: "" });
            setPhoto(null);
          }} className="text-sm text-orange-500 hover:text-orange-600 font-medium transition">
            Submit another request →
          </button>
        </div>
      </main>
    );
  }

  // FORM
  if (showForm) {
    return (
      <main className="min-h-screen bg-[#F8F8F7]">
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition cursor-pointer bg-transparent border-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-[14px]">Cape Parts Finder</span>
            </div>
            <div className="w-12" />
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 pb-16">
          <div className="mb-5">
            <h2 className="text-[22px] font-bold text-gray-900">Request a Part</h2>
            <p className="text-sm text-gray-400 mt-0.5">We'll source it and send you a quote on WhatsApp.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Info</p>
              <input name="customer_name" placeholder="Full Name *" value={formData.customer_name} onChange={handleChange} required
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-50 transition" />
              <input name="phone_number" placeholder="WhatsApp Number *" value={formData.phone_number} onChange={handleChange} required type="tel"
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-50 transition" />
              <div className="grid grid-cols-2 gap-2">
                <input name="email" placeholder="Email (optional)" value={formData.email} onChange={handleChange} type="email"
                  className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-50 transition" />
                <input name="area" placeholder="Your Area" value={formData.area} onChange={handleChange}
                  className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-50 transition" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle</p>
              <div className="grid grid-cols-3 gap-2">
                <input name="vehicle_make" placeholder="Make" value={formData.vehicle_make} onChange={handleChange}
                  className="border border-gray-100 bg-gray-50 rounded-xl px-3 py-3 text-[14px] outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-50 transition" />
                <input name="vehicle_model" placeholder="Model" value={formData.vehicle_model} onChange={handleChange}
                  className="border border-gray-100 bg-gray-50 rounded-xl px-3 py-3 text-[14px] outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-50 transition" />
                <input name="vehicle_year" placeholder="Year" value={formData.vehicle_year} onChange={handleChange} type="number"
                  className="border border-gray-100 bg-gray-50 rounded-xl px-3 py-3 text-[14px] outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-50 transition" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input name="vin_number" placeholder="VIN Number" value={formData.vin_number} onChange={handleChange}
                  className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-50 transition" />
                <input name="engine_size" placeholder="Engine Size" value={formData.engine_size} onChange={handleChange}
                  className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-50 transition" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Part Details</p>
              <input name="part_needed" placeholder="What part do you need? *" value={formData.part_needed} onChange={handleChange} required
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-50 transition" />
              <div>
                <p className="text-[11px] text-gray-400 mb-2">Part preference</p>
                <div className="flex gap-2">
                  {[{ val: "aftermarket", label: "Aftermarket" }, { val: "original", label: "Original OEM" }, { val: "either", label: "Either" }].map((p) => (
                    <button key={p.val} type="button" onClick={() => setFormData({ ...formData, part_preference: p.val })}
                      className={`flex-1 py-2 rounded-xl text-[12px] font-medium border transition cursor-pointer ${
                        formData.part_preference === p.val ? "bg-gray-900 border-gray-900 text-white" : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300"
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea name="extra_details" placeholder="Extra details — colour, side, condition (optional)"
                value={formData.extra_details} onChange={handleChange} rows={2}
                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-50 transition resize-none" />
              <div>
                <p className="text-[11px] text-gray-400 mb-2">Photo (optional)</p>
                <div onClick={() => document.getElementById("photo-input")?.click()}
                  className="border border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-orange-300 transition bg-gray-50 hover:bg-white">
                  {photo ? (
                    <div className="flex items-center gap-3">
                      <img src={URL.createObjectURL(photo)} alt="Preview" className="w-11 h-11 object-cover rounded-lg" />
                      <div>
                        <p className="text-[13px] font-medium text-gray-700 truncate max-w-[180px]">{photo.name}</p>
                        <p className="text-[11px] text-gray-400">Tap to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-gray-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span className="text-[13px]">Add a photo of the part or damage</span>
                    </div>
                  )}
                </div>
                <input id="photo-input" type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-4 rounded-2xl font-bold text-[15px] transition cursor-pointer">
              {loading ? "Submitting..." : "Submit Request"}
            </button>
            <p className="text-center text-[11px] text-gray-400 pb-4">We'll reach out via WhatsApp with your quote</p>
          </form>
        </div>
      </main>
    );
  }

  // LANDING
  return (
    <main className="min-h-screen bg-white overflow-hidden">

      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-[15px] tracking-tight">Cape Parts Finder</span>
        </div>
        <a href="/login" className="text-[13px] text-gray-400 hover:text-gray-600 transition no-underline">Admin →</a>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-6 lg:pt-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-8 border border-orange-100">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Serving Cape Town · Fast Turnaround
          </div>
          <h1 className="text-[48px] lg:text-[64px] font-black text-gray-900 leading-[1.05] tracking-tight mb-6">
            The smarter way<br />to find car parts<br />
            <span className="text-orange-500">in Cape Town.</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed max-w-xl mb-10">
            Tell us what you need. We tap into our supplier network and deliver a quote straight to your WhatsApp — no hassle, no runaround.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-semibold text-[14px] transition cursor-pointer shadow-md shadow-orange-200">
              Request a Part
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-400 px-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Free · No commitment
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 max-w-lg">
          {[
            { num: "500+", label: "Parts sourced" },
            { num: "9+", label: "Trusted suppliers" },
            { num: "24hr", label: "Avg response time" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-black text-gray-900">{s.num}</div>
              <div className="text-[12px] text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mx-6 max-w-6xl lg:mx-auto" />

      {/* How it works */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-10">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">How It Works</p>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { num: "01", title: "Tell us what you need", desc: "Submit your part request with vehicle details. Takes less than 2 minutes.", color: "bg-orange-500" },
            { num: "02", title: "We do the searching", desc: "Our team contacts our verified supplier network across Cape Town to find the best price.", color: "bg-gray-900" },
            { num: "03", title: "Get your quote on WhatsApp", desc: "We send you a quote directly on WhatsApp. Confirm and we arrange delivery or collection.", color: "bg-gray-900" },
          ].map((s) => (
            <div key={s.num} className="group">
              <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center mb-4`}>
                <span className="text-white text-[11px] font-bold">{s.num}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-[16px] mb-2 leading-tight">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why us */}
      <div className="bg-gray-950 mx-0 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Why Cape Parts Finder</p>
            <div className="flex-1 h-px bg-gray-800" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "⚡", title: "Fast", desc: "Same-day quotes on most requests" },
              { icon: "🔧", title: "Any Make", desc: "Japanese, German, Korean, local" },
              { icon: "💬", title: "WhatsApp", desc: "All communication on WhatsApp" },
              { icon: "✅", title: "Verified", desc: "Only trusted Cape Town suppliers" },
            ].map((item) => (
              <div key={item.title}>
                <div className="text-2xl mb-3">{item.icon}</div>
                <h4 className="font-bold text-white text-[14px] mb-1">{item.title}</h4>
                <p className="text-gray-500 text-[12px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-[32px] font-black text-gray-900 mb-4 tracking-tight leading-tight">
          Need a part? Let's find it.
        </h2>
        <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
          Submit a request now and we'll have a quote on your WhatsApp within hours.
        </p>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-semibold text-[14px] transition cursor-pointer shadow-md shadow-orange-200">
          Request a Part
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 py-5 px-6 text-center">
        <p className="text-gray-400 text-[11px]">© 2025 Cape Parts Finder · Cape Town, South Africa</p>
      </div>

    </main>
  );
}
