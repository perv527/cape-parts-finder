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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    let photo_url = "";

    try {
      // Upload image if selected
      if (photo) {
        const fileName = `${Date.now()}-${photo.name}`;

        const { error: uploadError } = await supabase.storage
          .from("parts-photos")
          .upload(fileName, photo);

        if (uploadError) {
          console.error(uploadError);
        } else {
          const { data } = supabase.storage
            .from("parts-photos")
            .getPublicUrl(fileName);

          photo_url = data.publicUrl;
        }
      }

      // Save request to database
      const { error } = await supabase.from("parts_requests").insert([
        {
          ...formData,
          photo_url,
        },
      ]);

      if (error) {
        console.error(error);
        alert("Something went wrong.");
      } else {
        setSuccess(true);

        setTimeout(() => {
          setSuccess(false);
        }, 4000);

        // Reset form
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
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-bold text-center mb-2">
          Cape Parts Finder
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Find vehicle parts quickly and easily
        </p>

        {success && (
          <div className="bg-green-500 text-white p-4 rounded-xl mb-6 text-center font-bold">
            Request submitted successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="customer_name"
            placeholder="Customer Name"
            value={formData.customer_name}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
            required
          />

          <input
            type="text"
            name="phone_number"
            placeholder="Phone Number"
            value={formData.phone_number}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
          />

          <input
            type="text"
            name="area"
            placeholder="Area in Cape Town"
            value={formData.area}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
          />

          <input
            type="text"
            name="vehicle_make"
            placeholder="Vehicle Make"
            value={formData.vehicle_make}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
          />

          <input
            type="text"
            name="vehicle_model"
            placeholder="Vehicle Model"
            value={formData.vehicle_model}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
          />

          <input
            type="text"
            name="vehicle_year"
            placeholder="Vehicle Year"
            value={formData.vehicle_year}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
          />

          <input
            type="text"
            name="vin_number"
            placeholder="VIN Number"
            value={formData.vin_number}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
          />

          <input
            type="text"
            name="engine_size"
            placeholder="Engine Size"
            value={formData.engine_size}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
          />

          <input
            type="text"
            name="part_needed"
            placeholder="Part Needed"
            value={formData.part_needed}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
          />

          <select
            name="part_preference"
            value={formData.part_preference}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl"
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
            className="w-full border p-3 rounded-xl h-32"
          />

          <div>
            <label className="block font-semibold mb-2">
              Upload Part / Vehicle / VIN Photo
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setPhoto(e.target.files?.[0] || null)
              }
              className="w-full border p-3 rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 py-3 rounded-xl w-full disabled:bg-gray-400"
          >
            {loading ? "Submitting..." : "Submit Parts Request"}
          </button>
        </form>
      </div>
    </main>
  );
}