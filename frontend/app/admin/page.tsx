"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("admin_logged_in");

    if (!loggedIn) {
      router.push("/login");
    } else {
      fetchRequests();
    }
  }, []);

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("parts_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setRequests(data || []);
    }
  }

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from("parts_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update status");
    } else {
      fetchRequests();
    }
  }

  function logout() {
    localStorage.removeItem("admin_logged_in");
    router.push("/login");
  }

  const filteredRequests = requests.filter((request) =>
    `${request.customer_name} ${request.vehicle_make} ${request.vehicle_model} ${request.part_needed}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">
            Parts Requests Admin
          </h1>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-xl"
          >
            Logout
          </button>
        </div>

        <input
          type="text"
          placeholder="Search requests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-4 rounded-xl border mb-6"
        />

        <div className="space-y-6">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white p-6 rounded-2xl shadow border"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {request.customer_name}
                </h2>

                <select
                  value={request.status || "New"}
                  onChange={(e) =>
                    updateStatus(request.id, e.target.value)
                  }
                  className="border p-2 rounded-xl"
                >
                  <option>New</option>
                  <option>Searching</option>
                  <option>Quoted</option>
                  <option>Ordered</option>
                  <option>Delivered</option>
                  <option>Closed</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Phone:</strong> {request.phone_number}</p>
                  <p><strong>Email:</strong> {request.email}</p>
                  <p><strong>Area:</strong> {request.area}</p>
                  <p><strong>VIN:</strong> {request.vin_number}</p>
                  <p><strong>Engine:</strong> {request.engine_size}</p>
                </div>

                <div>
                  <p><strong>Vehicle:</strong> {request.vehicle_make}</p>
                  <p><strong>Model:</strong> {request.vehicle_model}</p>
                  <p><strong>Year:</strong> {request.vehicle_year}</p>
                  <p><strong>Part:</strong> {request.part_needed}</p>
                  <p><strong>Preference:</strong> {request.part_preference}</p>
                </div>
              </div>

              {request.extra_details && (
                <div className="mt-4">
                  <p className="font-bold">Extra Details:</p>
                  <p>{request.extra_details}</p>
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <a
                  href={`https://wa.me/${request.phone_number.replace(/\D/g, "")}`}
                  target="_blank"
                  className="bg-green-500 text-white px-4 py-2 rounded-xl"
                >
                  WhatsApp Customer
                </a>
              </div>

              {request.photo_url && (
                <div className="mt-6">
                  <p className="font-bold mb-2">
                    Uploaded Photo
                  </p>

                  <img
                    src={request.photo_url}
                    alt="Uploaded"
                    className="w-64 rounded-xl border"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}