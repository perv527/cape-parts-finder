"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        fetchRequests();
        setAuthChecked(true);
      }
    });
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
      alert("Failed to update status");
    } else {
      fetchRequests();
    }
  }

  async function deleteRequest(id: number) {
    if (!confirm("Are you sure you want to delete this request?")) return;
    const { error } = await supabase
      .from("parts_requests")
      .delete()
      .eq("id", id);
    if (error) {
      alert("Failed to delete request");
    } else {
      fetchRequests();
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function exportToCSV() {
    const headers = [
      "Name", "Phone", "Email", "Area", "Vehicle Make",
      "Vehicle Model", "Year", "VIN", "Engine", "Part Needed",
      "Preference", "Extra Details", "Status", "Date"
    ];
    const rows = filteredRequests.map((r) => [
      r.customer_name, r.phone_number, r.email, r.area,
      r.vehicle_make, r.vehicle_model, r.vehicle_year,
      r.vin_number, r.engine_size, r.part_needed,
      r.part_preference, r.extra_details, r.status,
      new Date(r.created_at).toLocaleDateString("en-ZA")
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell || ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "parts-requests.csv";
    a.click();
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = `${request.customer_name} ${request.vehicle_make} ${request.vehicle_model} ${request.part_needed}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || (request.status || "New") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    All: requests.length,
    New: requests.filter((r) => !r.status || r.status === "New").length,
    Searching: requests.filter((r) => r.status === "Searching").length,
    Quoted: requests.filter((r) => r.status === "Quoted").length,
    Ordered: requests.filter((r) => r.status === "Ordered").length,
    Delivered: requests.filter((r) => r.status === "Delivered").length,
    Closed: requests.filter((r) => r.status === "Closed").length,
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-black text-white px-8 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔧</span>
          <div>
            <h1 className="text-xl font-bold">Cape Parts Finder</h1>
            <p className="text-xs text-gray-400">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={exportToCSV}
            className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-600 transition"
          >
            Export CSV
          </button>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow text-center">
            <p className="text-3xl font-bold">{statusCounts.All}</p>
            <p className="text-gray-500 text-sm">Total Requests</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl shadow text-center">
            <p className="text-3xl font-bold text-blue-600">{statusCounts.New}</p>
            <p className="text-gray-500 text-sm">New</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-2xl shadow text-center">
            <p className="text-3xl font-bold text-yellow-600">{statusCounts.Searching + statusCounts.Quoted}</p>
            <p className="text-gray-500 text-sm">In Progress</p>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl shadow text-center">
            <p className="text-3xl font-bold text-green-600">{statusCounts.Delivered}</p>
            <p className="text-gray-500 text-sm">Delivered</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, vehicle or part..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-black"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="All">All ({statusCounts.All})</option>
            <option value="New">New ({statusCounts.New})</option>
            <option value="Searching">Searching ({statusCounts.Searching})</option>
            <option value="Quoted">Quoted ({statusCounts.Quoted})</option>
            <option value="Ordered">Ordered ({statusCounts.Ordered})</option>
            <option value="Delivered">Delivered ({statusCounts.Delivered})</option>
            <option value="Closed">Closed ({statusCounts.Closed})</option>
          </select>
        </div>

        <p className="text-gray-500 text-sm mb-4">
          Showing {filteredRequests.length} of {requests.length} requests
        </p>

        <div className="space-y-6">
          {filteredRequests.length === 0 && (
            <div className="text-center text-gray-500 py-12 bg-white rounded-2xl">
              No requests found.
            </div>
          )}

          {filteredRequests.map((request) => (
            <div key={request.id} className="bg-white p-6 rounded-2xl shadow border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{request.customer_name}</h2>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(request.created_at).toLocaleString("en-ZA")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={request.status || "New"}
                    onChange={(e) => updateStatus(request.id, e.target.value)}
                    className="border p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option>New</option>
                    <option>Searching</option>
                    <option>Quoted</option>
                    <option>Ordered</option>
                    <option>Delivered</option>
                    <option>Closed</option>
                  </select>
                  <button
                    onClick={() => deleteRequest(request.id)}
                    className="text-red-400 hover:text-red-600 text-sm px-3 py-2 border border-red-200 rounded-xl hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p><strong>Phone:</strong> {request.phone_number}</p>
                  <p><strong>Email:</strong> {request.email}</p>
                  <p><strong>Area:</strong> {request.area}</p>
                  <p><strong>VIN:</strong> {request.vin_number}</p>
                  <p><strong>Engine:</strong> {request.engine_size}</p>
                </div>
                <div className="space-y-1">
                  <p><strong>Vehicle:</strong> {request.vehicle_make} {request.vehicle_model} {request.vehicle_year}</p>
                  <p><strong>Part:</strong> {request.part_needed}</p>
                  <p><strong>Preference:</strong> {request.part_preference}</p>
                </div>
              </div>

              {request.extra_details && (
                <div className="mt-4 bg-gray-50 p-3 rounded-xl text-sm">
                  <p className="font-bold mb-1">Extra Details:</p>
                  <p className="text-gray-700">{request.extra_details}</p>
                </div>
              )}

              <div className="mt-6 flex gap-3 flex-wrap">
                
                  href={`https://wa.me/${request.phone_number.replace(/\D/g, "")}?text=Hi ${request.customer_name}, we found your ${request.vehicle_make} ${request.vehicle_model} ${request.part_needed} request on Cape Parts Finder. We have some options for you!`}
                  target="_blank"
                  className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-600 transition"
                >
                  WhatsApp Customer
                </a>
                
                  href={`mailto:${request.email}?subject=Your Parts Request - Cape Parts Finder&body=Hi ${request.customer_name}, regarding your request for ${request.part_needed}...`}
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-600 transition"
                >
                  Email Customer
                </a>
              </div>

              {request.photo_url && (
                <div className="mt-6">
                  <p className="font-bold mb-2 text-sm">Uploaded Photo</p>
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