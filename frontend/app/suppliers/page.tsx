"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SuppliersPage() {
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    whatsapp_number: "",
    email: "",
    area: "",
    speciality: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
    } else {
      setAuthChecked(true);
      fetchSuppliers();
    }
  }

  async function fetchSuppliers() {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (!error && data) {
      setSuppliers(data);
    }
  }

  async function saveSupplier() {
    if (!formData.name || !formData.whatsapp_number) {
      alert("Name and WhatsApp number are required");
      return;
    }

    if (editingId) {
      await supabase
        .from("suppliers")
        .update(formData)
        .eq("id", editingId);
    } else {
      await supabase
        .from("suppliers")
        .insert([formData]);
    }

    resetForm();
    fetchSuppliers();
  }

  async function deleteSupplier(id: number) {
    const confirmed = confirm(
      "Delete this supplier?"
    );

    if (!confirmed) return;

    await supabase
      .from("suppliers")
      .delete()
      .eq("id", id);

    fetchSuppliers();
  }

  async function toggleActive(
    id: number,
    active: boolean
  ) {
    await supabase
      .from("suppliers")
      .update({ active: !active })
      .eq("id", id);

    fetchSuppliers();
  }

  function editSupplier(supplier: any) {
    setFormData({
      name: supplier.name || "",
      contact_person:
        supplier.contact_person || "",
      whatsapp_number:
        supplier.whatsapp_number || "",
      email: supplier.email || "",
      area: supplier.area || "",
      speciality:
        supplier.speciality || "",
    });

    setEditingId(supplier.id);
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      name: "",
      contact_person: "",
      whatsapp_number: "",
      email: "",
      area: "",
      speciality: "",
    });

    setEditingId(null);
    setShowForm(false);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  const filteredSuppliers =
    suppliers.filter((supplier) =>
      (
        supplier.name +
        " " +
        supplier.area +
        " " +
        supplier.speciality
      )
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const activeCount = suppliers.filter(
    (s) => s.active
  ).length;

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-lg">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa]">

      <header className="bg-white border-b px-8 py-5 flex justify-between items-center sticky top-0 z-50">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Suppliers
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage your supplier network
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={() =>
              router.push("/admin")
            }
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-xl transition"
          >
            Admin
          </button>

          <button
            onClick={() =>
              router.push("/sales")
            }
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-xl transition"
          >
            Sales
          </button>

          <button
            onClick={() =>
              setShowForm(true)
            }
            className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-xl transition shadow"
          >
            Add Supplier
          </button>

        </div>

      </header>

      <div className="max-w-7xl mx-auto p-8">

        <div className="grid md:grid-cols-3 gap-5 mb-8">

          <div className="bg-white rounded-3xl p-6 shadow-sm border">

            <p className="text-sm text-gray-500">
              Total Suppliers
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {suppliers.length}
            </h2>

          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border">

            <p className="text-sm text-gray-500">
              Active
            </p>

            <h2 className="text-4xl font-bold text-gray-900 mt-2">
              {activeCount}
            </h2>

          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border">

            <p className="text-sm text-gray-500">
              Inactive
            </p>

            <h2 className="text-4xl font-bold text-gray-400 mt-2">
              {suppliers.length - activeCount}
            </h2>

          </div>

        </div>

        <div className="bg-white rounded-3xl shadow-sm border p-5 mb-8">

          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full border rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black"
          />

        </div>

        {showForm && (
          <div className="bg-white rounded-3xl shadow-sm border p-8 mb-8">

            <div className="flex justify-between items-center mb-6">

              <h2 className="text-2xl font-bold">
                {editingId
                  ? "Edit Supplier"
                  : "Add Supplier"}
              </h2>

              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-black transition"
              >
                Close
              </button>

            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <input
                name="name"
                placeholder="Business Name"
                value={formData.name}
                onChange={handleChange}
                className="border rounded-2xl p-4"
              />

              <input
                name="contact_person"
                placeholder="Contact Person"
                value={
                  formData.contact_person
                }
                onChange={handleChange}
                className="border rounded-2xl p-4"
              />

              <input
                name="whatsapp_number"
                placeholder="WhatsApp Number"
                value={
                  formData.whatsapp_number
                }
                onChange={handleChange}
                className="border rounded-2xl p-4"
              />

              <input
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="border rounded-2xl p-4"
              />

              <input
                name="area"
                placeholder="Area"
                value={formData.area}
                onChange={handleChange}
                className="border rounded-2xl p-4"
              />

              <input
                name="speciality"
                placeholder="Speciality"
                value={formData.speciality}
                onChange={handleChange}
                className="border rounded-2xl p-4"
              />

            </div>

            <div className="flex gap-4 mt-6">

              <button
                onClick={saveSupplier}
                className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-2xl transition"
              >
                {editingId
                  ? "Update Supplier"
                  : "Save Supplier"}
              </button>

              <button
                onClick={resetForm}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-2xl transition"
              >
                Cancel
              </button>

            </div>

          </div>
        )}

        <div className="grid xl:grid-cols-2 gap-6">

          {filteredSuppliers.map(
            (supplier) => (
              <div
                key={supplier.id}
                className="bg-white rounded-3xl border shadow-sm p-6 hover:shadow-md transition"
              >

                <div className="flex justify-between items-start mb-5">

                  <div>

                    <div className="flex items-center gap-3">

                      <h2 className="text-2xl font-bold text-gray-900">
                        {supplier.name}
                      </h2>

                      <div
                        className={`w-3 h-3 rounded-full ${
                          supplier.active
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />

                    </div>

                    <p className="text-gray-500 text-sm mt-1">
                      {supplier.speciality ||
                        "General Parts"}
                    </p>

                  </div>

                </div>

                <div className="space-y-3 text-sm text-gray-700">

                  <p>
                    <strong>
                      Contact:
                    </strong>{" "}
                    {supplier.contact_person ||
                      "-"}
                  </p>

                  <p>
                    <strong>
                      WhatsApp:
                    </strong>{" "}
                    {
                      supplier.whatsapp_number
                    }
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {supplier.email || "-"}
                  </p>

                  <p>
                    <strong>Area:</strong>{" "}
                    {supplier.area || "-"}
                  </p>

                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">

                  <button
                    onClick={() =>
                      window.open(
                        "https://wa.me/" +
                          supplier.whatsapp_number.replace(
                            /\D/g,
                            ""
                          )
                      )
                    }
                    className="bg-[#f4f4f5] hover:bg-[#e4e4e7] text-gray-800 py-3 rounded-2xl transition font-medium"
                  >
                    WhatsApp
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        "mailto:" +
                          supplier.email
                      )
                    }
                    className="bg-[#f4f4f5] hover:bg-[#e4e4e7] text-gray-800 py-3 rounded-2xl transition font-medium"
                  >
                    Email
                  </button>

                  <button
                    onClick={() =>
                      editSupplier(supplier)
                    }
                    className="bg-black hover:bg-gray-800 text-white py-3 rounded-2xl transition font-medium"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      toggleActive(
                        supplier.id,
                        supplier.active
                      )
                    }
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-2xl transition font-medium"
                  >
                    {supplier.active
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                </div>

                <button
                  onClick={() =>
                    deleteSupplier(
                      supplier.id
                    )
                  }
                  className="w-full mt-3 border border-red-200 text-red-500 hover:bg-red-50 py-3 rounded-2xl transition font-medium"
                >
                  Delete Supplier
                </button>

              </div>
            )
          )}

        </div>

      </div>

    </main>
  );
}
