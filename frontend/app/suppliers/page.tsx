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

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">

      <header className="bg-black text-white px-6 py-4 flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold">
            Suppliers
          </h1>

          <p className="text-sm text-gray-400">
            Manage supplier contacts
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">

          <button
            onClick={() =>
              router.push("/admin")
            }
            className="bg-gray-700 px-4 py-2 rounded-xl"
          >
            Admin
          </button>

          <button
            onClick={() =>
              router.push("/sales")
            }
            className="bg-gray-700 px-4 py-2 rounded-xl"
          >
            Sales
          </button>

          <button
            onClick={() =>
              setShowForm(true)
            }
            className="bg-green-500 px-4 py-2 rounded-xl"
          >
            Add Supplier
          </button>

        </div>

      </header>

      <div className="max-w-6xl mx-auto p-6">

        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow mb-6">

            <h2 className="text-xl font-bold mb-4">
              {editingId
                ? "Edit Supplier"
                : "Add Supplier"}
            </h2>

            <div className="grid md:grid-cols-2 gap-4">

              <input
                name="name"
                placeholder="Business Name"
                value={formData.name}
                onChange={handleChange}
                className="border p-3 rounded-xl"
              />

              <input
                name="contact_person"
                placeholder="Contact Person"
                value={formData.contact_person}
                onChange={handleChange}
                className="border p-3 rounded-xl"
              />

              <input
                name="whatsapp_number"
                placeholder="WhatsApp Number"
                value={formData.whatsapp_number}
                onChange={handleChange}
                className="border p-3 rounded-xl"
              />

              <input
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="border p-3 rounded-xl"
              />

              <input
                name="area"
                placeholder="Area"
                value={formData.area}
                onChange={handleChange}
                className="border p-3 rounded-xl"
              />

              <input
                name="speciality"
                placeholder="Speciality"
                value={formData.speciality}
                onChange={handleChange}
                className="border p-3 rounded-xl"
              />

            </div>

            <div className="flex gap-3 mt-4">

              <button
                onClick={saveSupplier}
                className="bg-black text-white px-6 py-3 rounded-xl"
              >
                {editingId
                  ? "Update Supplier"
                  : "Save Supplier"}
              </button>

              <button
                onClick={resetForm}
                className="bg-gray-300 px-6 py-3 rounded-xl"
              >
                Cancel
              </button>

            </div>

          </div>
        )}

        <div className="space-y-4">

          {suppliers.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">
              No suppliers added yet.
            </div>
          )}

          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="bg-white rounded-2xl p-6 shadow border"
            >

              <div className="flex flex-col md:flex-row justify-between gap-6">

                <div>

                  <div className="flex items-center gap-3 mb-3">

                    <h2 className="text-xl font-bold">
                      {supplier.name}
                    </h2>

                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        supplier.active
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {supplier.active
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </div>

                  <div className="space-y-1 text-sm">

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
                      <strong>
                        Email:
                      </strong>{" "}
                      {supplier.email || "-"}
                    </p>

                    <p>
                      <strong>
                        Area:
                      </strong>{" "}
                      {supplier.area || "-"}
                    </p>

                    <p>
                      <strong>
                        Speciality:
                      </strong>{" "}
                      {supplier.speciality ||
                        "-"}
                    </p>

                  </div>

                </div>

                <div className="flex flex-col gap-2">

                  <button
                    onClick={() =>
                      editSupplier(
                        supplier
                      )
                    }
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl"
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
                    className={`px-4 py-2 rounded-xl text-white ${
                      supplier.active
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  >
                    {supplier.active
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                  <button
                    onClick={() =>
                      deleteSupplier(
                        supplier.id
                      )
                    }
                    className="bg-red-500 text-white px-4 py-2 rounded-xl"
                  >
                    Delete
                  </button>

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
                    className="bg-green-600 text-white px-4 py-2 rounded-xl"
                  >
                    WhatsApp
                  </button>

                </div>

              </div>

            </div>
          ))}

        </div>

      </div>

    </main>
  );
}
