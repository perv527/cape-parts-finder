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
        } catch (emailErr) {
          console.error("Email failed:", emailErr);
        }
        setSuccess(true);
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // ── SUCCESS STATE ──
  if (success) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Received</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            We have your request for a <span className="font-semibold text-gray-700">{formData.part_needed}</span>.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            We'll be in touch on <span className="font-semibold text-gray-700">{formData.phone_number}</span> shortly via WhatsApp.
          </p>
          <button onClick={() => {
            setSuccess(false); setShowForm(false);
            setFormData({ customer_name: "", phone_number: "", email: "", area: "", vehicle_make: "", vehicle_model: "", vehicle_year: "", vin_number: "", engine_size: "", part_needed: "", part_preference: "aftermarket", extra_details: "" });
            setPhoto(null);
          }} className="text-orange-500 hover:text-orange-600 font-medium text-sm transition">
            Submit another request →
          </button>
        </div>
      </main>
    );
  }

  // ── FORM STATE ──
  if (showForm) {
    return (
      <main className="min-h-screen bg-[#FAFAF9]">

        {/* Form Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
            <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition cursor-pointer bg-transparent border-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Cape Parts Finder</span>
            </div>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-lg mx-auto px-5 py-6 pb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Part Request Form</h2>
            <p className="text-sm text-gray-400 mt-1">Fill in the details and we'll source your part.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* YOUR DETAILS */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Your Details</p>
              <div className="space-y-3">
                <input name="customer_name" placeholder="Full Name *" value={formData.customer_name} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition" />
                <input name="phone_number" placeholder="WhatsApp Number *" value={formData.phone_number} onChange={handleChange} required type="tel"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition" />
                <div className="grid grid-cols-2 gap-3">
                  <input name="email" placeholder="Email (optional)" value={formData.email} onChange={handleChange} type="email"
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition" />
                  <input name="area" placeholder="Your Area" value={formData.area} onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition" />
                </div>
              </div>
            </div>

            {/* VEHICLE INFO */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Vehicle Info</p>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <input name="vehicle_make" placeholder="Make" value={formData.vehicle_make} onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition" />
                  <input name="vehicle_model" placeholder="Model" value={formData.vehicle_model} onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition" />
                  <input name="vehicle_year" placeholder="Year" value={formData.vehicle_year} onChange={handleChange} type="number"
                    className="border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="vin_number" placeholder="VIN Number" value={formData.vin_number} onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition" />
                  <input name="engine_size" placeholder="Engine Size" value={formData.engine_size} onChange={handleChange}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition" />
                </div>
              </div>
            </div>

            {/* PART DETAILS */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Part Details</p>
              <div className="space-y-3">
                <input name="part_needed" placeholder="Part needed  e.g. front bumper, alternator *" value={formData.part_needed} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition" />
                <div>
                  <p className="text-[12px] text-gray-400 mb-2">Part preference</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: "aftermarket", label: "Aftermarket" },
                      { val: "original", label: "Original" },
                      { val: "either", label: "Either" },
                    ].map((p) => (
                      <button key={p.val} type="button" onClick={() => setFormData({ ...formData, part_preference: p.val })}
                        className={`py-2.5 rounded-xl text-[12px] font-medium border transition cursor-pointer ${
                          formData.part_preference === p.val
                            ? "bg-gray-900 border-gray-900 text-white"
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea name="extra_details" placeholder="Extra details — colour, condition, side, etc. (optional)"
                  value={formData.extra_details} onChange={handleChange} rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition resize-none" />
                <div>
                  <p className="text-[12px] text-gray-400 mb-2">Photo (optional — helps us find the right part)</p>
                  <div onClick={() => document.getElementById("photo-input")?.click()}
                    className="border border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-orange-300 transition">
                    {photo ? (
                      <div className="flex items-center gap-3">
                        <img src={URL.createObjectURL(photo)} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-gray-100" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{photo.name}</p>
                          <p className="text-[12px] text-gray-400">Tap to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-gray-400">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span className="text-sm">Add a photo of the part</span>
                      </div>
                    )}
                  </div>
                  <input id="photo-input" type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-4 rounded-2xl font-semibold text-[15px] transition cursor-pointer shadow-sm shadow-orange-200">
              {loading ? "Submitting..." : "Submit Request"}
            </button>
            <p className="text-center text-[12px] text-gray-400">
              We'll contact you via WhatsApp with a quote
            </p>
          </form>
        </div>
      </main>
    );
  }

  // ── LANDING PAGE ──
  return (
    <main className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="border-b border-gray-100 px-5 h-14 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-[15px]">Cape Parts Finder</span>
        </div>
        <a href="/login" className="text-sm text-gray-400 hover:text-gray-600 transition no-underline">Admin</a>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-5 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-600 px-3.5 py-1.5 rounded-full text-[12px] font-semibold mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          Cape Town's Fastest Parts Sourcing Service
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-4">
          Find Any Car Part<br />
          <span className="text-orange-500">Fast & Reliably</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          We source parts from our trusted supplier network across Cape Town and deliver quotes directly to your WhatsApp.
        </p>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-semibold text-[15px] transition cursor-pointer shadow-lg shadow-orange-200">
          Request a Part
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
        <p className="text-gray-400 text-sm mt-4">Free · No commitment · Response within hours</p>
      </div>

      {/* How it works */}
      <div className="bg-[#FAFAF9] border-y border-gray-100 py-14 px-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-10">How It Works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Submit Your Request", desc: "Tell us what part you need and your vehicle details. Takes under 2 minutes." },
              { num: "02", title: "We Source It", desc: "We contact our network of trusted Cape Town suppliers to find the best price." },
              { num: "03", title: "Get Your Quote", desc: "Receive a quote via WhatsApp. Confirm and we'll arrange delivery or collection." },
            ].map((step) => (
              <div key={step.num} className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="text-orange-500 font-bold text-[13px] mb-3">{step.num}</div>
                <h3 className="font-bold text-gray-900 text-[15px] mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust section */}
      <div className="py-14 px-5 max-w-4xl mx-auto">
        <p className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-10">Why Choose Us</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "⚡", title: "Fast Response", desc: "Same day quotes on most parts" },
            { icon: "🔧", title: "All Makes", desc: "Japanese, German, local & more" },
            { icon: "💬", title: "WhatsApp Updates", desc: "We keep you in the loop" },
            { icon: "✅", title: "Trusted Network", desc: "Verified Cape Town suppliers" },
          ].map((item) => (
            <div key={item.title} className="bg-[#FAFAF9] border border-gray-100 rounded-2xl p-5 text-center">
              <div className="text-2xl mb-3">{item.icon}</div>
              <h4 className="font-bold text-gray-900 text-[13px] mb-1">{item.title}</h4>
              <p className="text-gray-400 text-[12px] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-900 mx-5 mb-10 rounded-3xl py-12 px-6 text-center max-w-4xl lg:mx-auto">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to find your part?</h2>
        <p className="text-gray-400 text-sm mb-7">Join hundreds of Cape Town drivers who trust us to source their parts.</p>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition cursor-pointer">
          Request a Part Now
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 py-6 px-5 text-center">
        <p className="text-gray-400 text-[12px]">© 2025 Cape Parts Finder · Cape Town, South Africa</p>
      </div>

    </main>
  );
}
