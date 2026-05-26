"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
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

  if (success) {
    return (
      <main className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">We received your request for a <strong>{formData.part_needed}</strong>. We'll contact you on <strong>{formData.phone_number}</strong> shortly.</p>
          <button onClick={() => { setSuccess(false); setFormData({ customer_name: "", phone_number: "", email: "", area: "", vehicle_make: "", vehicle_model: "", vehicle_year: "", vin_number: "", engine_size: "", part_needed: "", part_preference: "aftermarket", extra_details: "" }); setPhoto(null); }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm transition cursor-pointer">
            Submit Another Request
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9]">

      {/* Header */}
      <div className="bg-orange-500 px-5 pt-10 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-[16px]">Cape Parts Finder</div>
              <div className="text-orange-100 text-[12px]">Cape Town · Fast · Reliable</div>
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold leading-tight">Find Your Car Part Fast</h1>
          <p className="text-orange-100 text-sm mt-1">Fill in the form below and we'll source your part from our supplier network.</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 -mt-4 pb-10">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* YOUR DETAILS */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-50">
            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-3">Your Details</p>
            <div className="space-y-3">
              <input name="customer_name" placeholder="Full Name *" value={formData.customer_name} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition" />
              <input name="phone_number" placeholder="WhatsApp Number *" value={formData.phone_number} onChange={handleChange} required type="tel"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition" />
              <div className="grid grid-cols-2 gap-3">
                <input name="email" placeholder="Email (optional)" value={formData.email} onChange={handleChange} type="email"
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition" />
                <input name="area" placeholder="Your Area" value={formData.area} onChange={handleChange}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition" />
              </div>
            </div>
          </div>

          {/* VEHICLE INFO */}
          <div className="px-5 pt-4 pb-4 border-b border-gray-50">
            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-3">Vehicle Info</p>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <input name="vehicle_make" placeholder="Make *" value={formData.vehicle_make} onChange={handleChange}
                  className="border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition" />
                <input name="vehicle_model" placeholder="Model *" value={formData.vehicle_model} onChange={handleChange}
                  className="border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition" />
                <input name="vehicle_year" placeholder="Year" value={formData.vehicle_year} onChange={handleChange} type="number"
                  className="border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="vin_number" placeholder="VIN Number" value={formData.vin_number} onChange={handleChange}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition" />
                <input name="engine_size" placeholder="Engine Size" value={formData.engine_size} onChange={handleChange}
                  className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition" />
              </div>
            </div>
          </div>

          {/* PART DETAILS */}
          <div className="px-5 pt-4 pb-5">
            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-3">Part Details</p>
            <div className="space-y-3">
              <input name="part_needed" placeholder="Part Needed *  (e.g. front bumper, alternator)" value={formData.part_needed} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition" />

              {/* Part preference toggle */}
              <div>
                <p className="text-[12px] text-gray-400 mb-2">Part preference</p>
                <div className="grid grid-cols-3 gap-2">
                  {["aftermarket", "original", "either"].map((pref) => (
                    <button key={pref} type="button"
                      onClick={() => setFormData({ ...formData, part_preference: pref })}
                      className={`py-2.5 rounded-xl text-[12px] font-medium border transition cursor-pointer capitalize ${
                        formData.part_preference === pref
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white border-gray-200 text-gray-500 hover:border-orange-300"
                      }`}>
                      {pref === "aftermarket" ? "Aftermarket" : pref === "original" ? "Original" : "Either"}
                    </button>
                  ))}
                </div>
              </div>

              <textarea name="extra_details" placeholder="Extra details (optional) — colour, condition, side, etc."
                value={formData.extra_details} onChange={handleChange} rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition resize-none" />

              {/* Photo upload */}
              <div>
                <p className="text-[12px] text-gray-400 mb-2">Photo (optional — helps us find the right part)</p>
                <div onClick={() => document.getElementById("photo-input")?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-orange-300 transition">
                  {photo ? (
                    <div className="flex items-center gap-3">
                      <img src={URL.createObjectURL(photo)} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{photo.name}</p>
                        <p className="text-[12px] text-gray-400">Tap to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span className="text-sm">Add a photo</span>
                    </div>
                  )}
                </div>
                <input id="photo-input" type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="px-5 pb-5">
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-4 rounded-xl font-bold text-[15px] transition cursor-pointer">
              {loading ? "Submitting..." : "Find My Part →"}
            </button>
            <p className="text-center text-[12px] text-gray-400 mt-3">
              We'll contact you via WhatsApp with a quote
            </p>
          </div>

        </form>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { icon: "⚡", label: "Fast Response" },
            { icon: "🔧", label: "All Makes" },
            { icon: "💬", label: "WhatsApp Updates" },
          ].map((b) => (
            <div key={b.label} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{b.icon}</div>
              <p className="text-[11px] font-semibold text-gray-500">{b.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
