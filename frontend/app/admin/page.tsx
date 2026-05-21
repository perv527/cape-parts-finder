"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [authChecked, setAuthChecked] =
    useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    fetchRequests();
    setAuthChecked(true);
  }

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("parts_requests")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setRequests(data || []);
  }

  async function updateStatus(
    id: number,
    status: string
  ) {
    const { error } = await supabase
      .from("parts_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("Failed to update status");
      return;
    }

    fetchRequests();
  }

  async function deleteRequest(id: number) {
    const confirmed = confirm(
      "Delete this request?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("parts_requests")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Failed to delete request");
      return;
    }

    fetchRequests();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function exportToCSV() {
    const headers = [
      "Name",
      "Phone",
      "Email",
      "Area",
      "Make",
      "Model",
      "Year",
      "VIN",
      "Engine",
      "Part",
      "Preference",
      "Details",
      "Status",
      "Date",
    ];

    const rows = requests.map((r) => [
      r.customer_name,
      r.phone_number,
      r.email,
      r.area,
      r.vehicle_make,
      r.vehicle_model,
      r.vehicle_year,
      r.vin_number,
      r.engine_size,
      r.part_needed,
      r.part_preference,
      r.extra_details,
      r.status,
      new Date(
        r.created_at
      ).toLocaleDateString("en-ZA"),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((c) => `"${c || ""}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url =
      window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "parts-requests.csv";

    a.click();
  }

  const filteredRequests =
    requests.filter((r) => {
      const matchesSearch = (
        r.customer_name +
        " " +
        r.vehicle_make +
        " " +
        r.vehicle_model +
        " " +
        r.part_needed
      )
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        (r.status || "New") ===
          statusFilter;

      return (
        matchesSearch && matchesStatus
      );
    });

  const counts = {
    All: requests.length,

    New: requests.filter(
      (r) =>
        !r.status ||
        r.status === "New"
    ).length,

    Searching: requests.filter(
      (r) =>
        r.status === "Searching"
    ).length,

    Quoted: requests.filter(
      (r) => r.status === "Quoted"
    ).length,

    Ordered: requests.filter(
      (r) => r.status === "Ordered"
    ).length,

    Delivered: requests.filter(
      (r) =>
        r.status === "Delivered"
    ).length,

    Closed: requests.filter(
      (r) => r.status === "Closed"
    ).length,
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white px-8 py-6 rounded-2xl shadow-lg">
          <p className="text-gray-700 text-lg font-medium">
            Loading Dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">

      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Cape Parts Finder
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Admin Dashboard
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={() => router.push("/admin")}
              className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
            >
              Dashboard
            </button>

            <button
              onClick={() => router.push("/suppliers")}
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium transition"
            >
              Suppliers
            </button>

            <button
              onClick={() => router.push("/sales")}
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium transition"
            >
              Sales
            </button>

            <button
              onClick={exportToCSV}
              className="bg-gray-800 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
            >
              Export CSV
            </button>

            <button
              onClick={logout}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-5 py-2.5 rounded-xl text-sm font-medium transition"
            >
              Logout
            </button>

          </div>

        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              Total Requests
            </p>

            <h2 className="text-4xl font-bold text-gray-900">
              {counts.All}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              New Requests
            </p>

            <h2 className="text-4xl font-bold text-gray-900">
              {counts.New}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              In Progress
            </p>

            <h2 className="text-4xl font-bold text-gray-900">
              {counts.Searching +
                counts.Quoted}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              Delivered
            </p>

            <h2 className="text-4xl font-bold text-gray-900">
              {counts.Delivered}
            </h2>
          </div>

        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 mb-8">

          <div className="flex flex-col lg:flex-row gap-4">

            <input
              type="text"
              placeholder="Search by customer, vehicle or part..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="flex-1 border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-gray-300"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="border border-gray-300 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="All">
                All ({counts.All})
              </option>

              <option value="New">
                New ({counts.New})
              </option>

              <option value="Searching">
                Searching (
                {counts.Searching})
              </option>

              <option value="Quoted">
                Quoted ({counts.Quoted})
              </option>

              <option value="Ordered">
                Ordered ({counts.Ordered})
              </option>

              <option value="Delivered">
                Delivered (
                {counts.Delivered})
              </option>

              <option value="Closed">
                Closed ({counts.Closed})
              </option>

            </select>

          </div>

        </div>

        <div className="space-y-6">

          {filteredRequests.map(
            (request) => (
              <div
                key={request.id}
                className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
              >

                <div className="p-6 border-b border-gray-100">

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {
                          request.customer_name
                        }
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(
                          request.created_at
                        ).toLocaleString(
                          "en-ZA"
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">

                      <select
                        value={
                          request.status ||
                          "New"
                        }
                        onChange={(e) =>
                          updateStatus(
                            request.id,
                            e.target.value
                          )
                        }
                        className="border border-gray-300 bg-white px-4 py-2.5 rounded-xl text-sm"
                      >
                        <option>
                          New
                        </option>

                        <option>
                          Searching
                        </option>

                        <option>
                          Quoted
                        </option>

                        <option>
                          Ordered
                        </option>

                        <option>
                          Delivered
                        </option>

                        <option>
                          Closed
                        </option>

                      </select>

                      <button
                        onClick={() =>
                          deleteRequest(
                            request.id
                          )
                        }
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-medium transition"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

                <div className="p-6">

                  <div className="grid lg:grid-cols-2 gap-8 text-sm">

                    <div className="space-y-3">

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Phone
                        </p>

                        <p className="font-medium text-gray-900">
                          {
                            request.phone_number
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Email
                        </p>

                        <p className="font-medium text-gray-900">
                          {request.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Area
                        </p>

                        <p className="font-medium text-gray-900">
                          {request.area}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          VIN
                        </p>

                        <p className="font-medium text-gray-900">
                          {
                            request.vin_number
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Engine
                        </p>

                        <p className="font-medium text-gray-900">
                          {
                            request.engine_size
                          }
                        </p>
                      </div>

                    </div>

                    <div className="space-y-3">

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Vehicle
                        </p>

                        <p className="font-medium text-gray-900">
                          {
                            request.vehicle_make
                          }{" "}
                          {
                            request.vehicle_model
                          }{" "}
                          {
                            request.vehicle_year
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Part Needed
                        </p>

                        <p className="font-medium text-gray-900">
                          {
                            request.part_needed
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wide">
                          Preference
                        </p>

                        <p className="font-medium text-gray-900">
                          {
                            request.part_preference
                          }
                        </p>
                      </div>

                    </div>

                  </div>

                  {request.extra_details && (
                    <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-5">

                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        Extra Details
                      </p>

                      <p className="text-sm text-gray-700 leading-relaxed">
                        {
                          request.extra_details
                        }
                      </p>

                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">

                    <button
                      onClick={() =>
                        router.push(
                          `/quotes/${request.id}`
                        )
                      }
                      className="bg-gray-900 hover:bg-black text-white px-5 py-3 rounded-xl text-sm font-medium transition"
                    >
                      View Quotes
                    </button>

                    <button
                      onClick={() =>
                        window.open(
                          "https://wa.me/" +
                            request.phone_number.replace(
                              /\D/g,
                              ""
                            )
                        )
                      }
                      className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-5 py-3 rounded-xl text-sm font-medium transition"
                    >
                      WhatsApp
                    </button>

                    <button
                      onClick={() =>
                        window.open(
                          "mailto:" +
                            request.email
                        )
                      }
                      className="bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 px-5 py-3 rounded-xl text-sm font-medium transition"
                    >
                      Email
                    </button>

                  </div>

                  {request.photo_url && (
                    <div className="mt-6">

                      <p className="text-sm font-semibold text-gray-900 mb-3">
                        Uploaded Photo
                      </p>

                      <img
                        src={
                          request.photo_url
                        }
                        alt="Uploaded"
                        className="w-72 rounded-2xl border border-gray-200 shadow-sm"
                      />

                    </div>
                  )}

                </div>

              </div>
            )
          )}

        </div>

      </div>

    </main>
  );
}
