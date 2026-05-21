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
      .order("created_at", { ascending: false });

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
      await supabase.from("suppliers").insert([formData]);
    }

    resetForm();
    fetchSuppliers();
  }

  async function deleteSupplier(id: number) {
    const confirmed = confirm("Delete this supplier?");

    if (!confirmed) return;

    await supabase
      .from("suppliers")
      .delete()
      .eq("id", id);

    fetchSuppliers();
  }

  async function toggleActive(id: number, active: boolean) {
    await supabase
      .from("suppliers")
      .update({ active: !active })
      .eq("id", id);

    fetchSuppliers();
  }

  function editSupplier(supplier: any) {
    setFormData({
      name: supplier.name || "",
      contact_person: supplier.contact_person || "",
      whatsapp_number: supplier.whatsapp_number || "",
      email: supplier.email || "",
      area: supplier.area || "",
      speciality: supplier.speciality || "",
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

  const filteredSuppliers = suppliers.filter((s) =>
    (
      s.name +
      " " +
      s.area +
      " " +
      s.speciality
    )
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const activeSuppliers = suppliers.filter(
    (s) => s.active
  ).length;

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">

      <header className="bg-black text-white px-8 py-5 flex justify-between items-center shadow-lg">

        <div>
          <h1 className="text-3xl font-bold">
            Suppliers
          </h1>

          <p className="text-gray-400 text-sm">
            Manage all supplier contacts
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={() => router.push("/admin")}
            className="bg-gray-700 hover:bg-gray-600 transition px-5 py-2 rounded-xl font-medium"
          >
            Admin
          </button>

          <button
            onClick={() => router.push("/sales")}
            className="bg-blue-600 hover:bg-blue-500 transition px-5 py-2 rounded-xl font-medium"
          >
            Sales
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="bg-green-500 hover:bg-green-400 transition px-5 py-2 rounded-xl font-medium shadow"
          >
            + Add Supplier
          </button>

        </div>

      </header>

      <div className="max-w-7xl mx-auto p-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          <div className="bg-white rounded-2xl p-6 shadow">
            <p className="text-gray-500 text-sm">
              Total Suppliers
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {suppliers.length}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <p className="text-gray-500 text-sm">
              Active Suppliers
            </p>

            <h2 className="text-4xl font-bold text-green-600 mt-2">
              {activeSuppliers}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow">
            <p className="text-gray-500 text-sm">
              Inactive Suppliers
            </p>

            <h2 className="text-4xl font-bold text-red-500 mt-2">
              {suppliers.length - activeSuppliers}
            </h2>
          </div>

        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-6">

          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full border p-4 rounded-xl"
          />

        </div>

        {showForm && (
          <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 border">

            <h2 className="text-2xl font-bold mb-6">
              {editingId
                ? "Edit Supplier"
                : "Add New Supplier"}
            </h2>

            <div className="grid md:grid-cols-2 gap-5">

              <input
                name="name"
                placeholder="Business Name"
                value={formData.name}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              />

              <input
                name="contact_person"
                placeholder="Contact Person"
                value={formData.contact_person}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              />

              <input
                name="whatsapp_number"
                placeholder="WhatsApp Number"
                value={formData.whatsapp_number}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              />

              <input
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              />

              <input
                name="area"
                placeholder="Area"
                value={formData.area}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              />

              <input
                name="speciality"
                placeholder="Speciality"
                value={formData.speciality}
                onChange={handleChange}
                className="border p-4 rounded-xl"
              />

            </div>

            <div className="flex gap-4 mt-6">

              <button
                onClick={saveSupplier}
                className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-semibold transition"
              >
                {editingId
                  ? "Update Supplier"
                  : "Save Supplier"}
              </button>

              <button
                onClick={resetForm}
                className="bg-gray-200 hover:bg-gray-300 px-8 py-3 rounded-xl font-semibold transition"
              >
                Cancel
              </button>

            </div>

          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">

          {filteredSuppliers.map((supplier) => (

            <div
              key={supplier.id}
              className="bg-white rounded-3xl shadow-lg p-6 border hover:shadow-2xl transition duration-300"
            >

              <div className="flex justify-between items-start mb-4">

                <div>

                  <div className="flex items-center gap-3">

                    <h2 className="text-2xl font-bold">
                      {supplier.name}
                    </h2>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        supplier.active
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-500"
                      }`}
                    >
                      {supplier.active
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </span>

                  </div>

                  <p className="text-gray-400 text-sm mt-1">
                    {supplier.speciality || "General Parts"}
                  </p>

                </div>

              </div>

              <div className="space-y-2 text-sm">

                <p>
                  <strong>Contact:</strong>{" "}
                  {supplier.contact_person || "-"}
                </p>

                <p>
                  <strong>WhatsApp:</strong>{" "}
                  {supplier.whatsapp_number}
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
                  className="bg-green-500 hover:bg-green-400 text-white py-3 rounded-xl font-semibold transition"
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
                  className="bg-blue-500 hover:bg-blue-400 text-white py-3 rounded-xl font-semibold transition"
                >
                  Email
                </button>

                <button
                  onClick={() =>
                    editSupplier(supplier)
                  }
                  className="bg-gray-800 hover:bg-black text-white py-3 rounded-xl font-semibold transition"
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
                  className={`py-3 rounded-xl font-semibold transition ${
                    supplier.active
                      ? "bg-yellow-500 hover:bg-yellow-400 text-white"
                      : "bg-green-500 hover:bg-green-400 text-white"
                  }`}
                >
                  {supplier.active
                    ? "Deactivate"
                    : "Activate"}
                </button>

              </div>

              <button
                onClick={() =>
                  deleteSupplier(supplier.id)
                }
                className="w-full mt-3 bg-red-500 hover:bg-red-400 text-white py-3 rounded-xl font-semibold transition"
              >
                Delete Supplier
              </button>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
}
