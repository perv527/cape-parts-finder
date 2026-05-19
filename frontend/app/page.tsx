"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: "",
    phone_number: "",
    email: "",
    area: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_year: "",
    vin_number: "",
    engine_size: "",
    part_needed: "",
    part_preference: "",
    extra_details: "",
  });

  const [photo, setPhoto] = useState<File | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let photo_url = "";

    try {
      if (photo) {
        const fileName = `${Date.now()}-${photo.name}`;
        const { error: uploadError } = await supabase.storage
          .from("parts-photos")
          .upload(fileName, photo);

        if (!uploadError) {
          const { data } = supabase.storage
            .from("parts-photos")
            .getPublicUrl(fileName);
          photo_url = data.publicUrl;
        }
      }

      const { error } = await supabase.from("parts_requests").insert([
        { ...formData, photo_url },
      ]);

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
        setTimeout(() => setSuccess(false), 5000);

        setFormData({
          customer_name: "",
          phone_number: "",
          email: "",
          area: "",
          vehicle_make: "",
          vehicle_model: "",
          vehicle_year: "",
          vin_number: "",
          engine_size: "",
          part_needed: "",
          part_preference: "",
          extra_details: "",
        });

        setPhoto(null);
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error occurred.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-black text-white py-4 px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔧</span>
          <div>
            <h1 className="text-xl font-bold leading-tight">Cape Parts Finder</h1>
            <p className="text-xs text-gray-400">Cape Town Vehicle Parts Network</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-300">
          <span>📞</span>
          <span>Fast. Reliable. Local.</span>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-black to-gray-800 text-white py-16 px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
          Find Any Car Part in Cape Town
        </h2>
        <p className="text-gray-300 text-lg max-w-xl mx-auto mb-6">
          Submit your parts request once and let us connect you with trusted local suppliers fast.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="bg-white text-black px-4 py-2 rounded-full font-semibold">✅ Free to Use</div>
          <div className="bg-white text-black px-4 py-2 rounded-full font-semibold">⚡ Fast Response</div>
          <div className="bg-white text-black px-4 py-2 rounded-full font-semibold">🛡️ Trusted Suppliers</div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-12 px-6 bg-white">
        <h3 className="text-2xl font-bold text-center mb-8">How It Works</h3>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 bg-gray-50 rounded-2xl shadow">
            <div className="text-4xl mb-3">📋</div>
            <h4 className="font-bold text-lg mb-2">1. Submit Request</h4>
            <p className="text-gray-500 text-sm">Fill in your vehicle and part details in under 2 minutes.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl shadow">
            <div className="text-4xl mb-3">🔍</div>
            <h4 className="font-bold text-lg mb-2">2. We Find Suppliers</h4>
            <p className="text-gray-500 text-sm">We match your request with trusted local parts suppliers.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl shadow">
            <div className="text-4xl mb-3">📞</div>
            <h4 className="font-bold text-lg mb-2">3. Get Contacted</h4>
            <p className="text-gray-500 text-sm">Suppliers contact you directly via WhatsApp or phone.</p>
          </div>
        </div>
      </section>

      {/* FORM SECTION */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl">

          <h3 className="text-2xl font-bold text-center mb-2">
            Submit Your Parts Request
          </h3>
          <p className="text-center text-gray-500 mb-8 text-sm">
            Fill in the form below and we will find your part fast.
          </p>

          {success && (
            <div className="bg-green-500 text-white p-4 rounded-xl mb-6 text-center font-bold text-lg">
              ✅ Request submitted! We will be in touch soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="customer_name"
                placeholder="Full Name *"
                value={formData.customer_name}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
              <input
                type="text"
                name="phone_number"
                placeholder="Phone Number *"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                type="text"
                name="area"
                placeholder="Area in Cape Town"
                value={formData.area}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="vehicle_make"
                placeholder="Vehicle Make"
                value={formData.vehicle_make}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                type="text"
                name="vehicle_model"
                placeholder="Vehicle Model"
                value={formData.vehicle_model}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                type="text"
                name="vehicle_year"
                placeholder="Year"
                value={formData.vehicle_year}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="vin_number"
                placeholder="VIN Number"
                value={formData.vin_number}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                type="text"
                name="engine_size"
                placeholder="Engine Size"
                value={formData.engine_size}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <input
              type="text"
              name="part_needed"
              placeholder="Part Needed *"
              value={formData.part_needed}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              required
            />

            <select
              name="part_preference"
              value={formData.part_preference}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">Select Part Preference</option>
              <option>Quality Aftermarket Part</option>
              <option>OEM Equivalent Aftermarket Part</option>
              <option>Cheapest Reliable Option</option>
            </select>

            <textarea
              name="extra_details"
              placeholder="Extra Details / Notes"
              value={formData.extra_details}
              onChange={handleChange}
              className="w-full border border-gray-300 p-3 rounded-xl h-28 focus:outline-none focus:ring-2 focus:ring-black"
            />

            <div className="border border-gray-300 p-4 rounded-xl">
              <label className="block font-semibold mb-2 text-sm text-gray-700">
                📷 Upload Photo (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-6 py-4 rounded-xl w-full font-bold text-lg hover:bg-gray-800 transition disabled:bg-gray-400"
            >
              {loading ? "Submitting..." : "🔧 Submit Parts Request"}
            </button>

          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-gray-400 text-center py-6 text-sm">
        <p>© 2026 Cape Parts Finder — Cape Town, South Africa</p>
        <p className="mt-1">Fast. Reliable. Local.</p>
      </footer>

    </main>
  );
}