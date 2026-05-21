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
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">
          Loading...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">

      <header className="bg-black text-white px-8 py-4 flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold">
            Cape Parts Finder
          </h1>

          <p className="text-sm text-gray-400">
            Admin Dashboard
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">

          <button
            onClick={() => router.push("/admin")}
            className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm"
          >
            Admin
          </button>

          <button
            onClick={() => router.push("/suppliers")}
            className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm"
          >
            Suppliers
          </button>

          <button
            onClick={() => router.push("/sales")}
            className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm"
          >
            Sales
          </button>

          <button
            onClick={exportToCSV}
            className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm"
          >
            Export CSV
          </button>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm"
          >
            Logout
          </button>

        </div>

      </header>

      <div className="max-w-7xl mx-auto p-8">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          <div className="bg-white p-4 rounded-2xl shadow text-center">
            <p className="text-3xl font-bold">
              {counts.All}
            </p>

            <p className="text-gray-500 text-sm">
              Total Requests
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl shadow text-center">
            <p className="text-3xl font-bold text-blue-600">
              {counts.New}
            </p>

            <p className="text-gray-500 text-sm">
              New
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-2xl shadow text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {counts.Searching +
                counts.Quoted}
            </p>

            <p className="text-gray-500 text-sm">
              In Progress
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-2xl shadow text-center">
            <p className="text-3xl font-bold text-green-600">
              {counts.Delivered}
            </p>

            <p className="text-gray-500 text-sm">
              Delivered
            </p>
          </div>

        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">

          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="flex-1 p-4 rounded-xl border"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="p-4 rounded-xl border"
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

        <div className="space-y-6">

          {filteredRequests.map(
            (request) => (
              <div
                key={request.id}
                className="bg-white p-6 rounded-2xl shadow border"
              >

                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">

                  <div>

                    <h2 className="text-2xl font-bold">
                      {
                        request.customer_name
                      }
                    </h2>

                    <p className="text-gray-400 text-xs">
                      {new Date(
                        request.created_at
                      ).toLocaleString(
                        "en-ZA"
                      )}
                    </p>

                  </div>

                  <div className="flex gap-3">

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
                      className="border p-2 rounded-xl text-sm"
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
                      className="text-red-500 border border-red-200 px-3 py-2 rounded-xl text-sm"
                    >
                      Delete
                    </button>

                  </div>

                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">

                  <div>

                    <p>
                      <strong>
                        Phone:
                      </strong>{" "}
                      {
                        request.phone_number
                      }
                    </p>

                    <p>
                      <strong>
                        Email:
                      </strong>{" "}
                      {request.email}
                    </p>

                    <p>
                      <strong>
                        Area:
                      </strong>{" "}
                      {request.area}
                    </p>

                    <p>
                      <strong>
                        VIN:
                      </strong>{" "}
                      {
                        request.vin_number
                      }
                    </p>

                    <p>
                      <strong>
                        Engine:
                      </strong>{" "}
                      {
                        request.engine_size
                      }
                    </p>

                  </div>

                  <div>

                    <p>
                      <strong>
                        Vehicle:
                      </strong>{" "}
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

                    <p>
                      <strong>
                        Part Needed:
                      </strong>{" "}
                      {
                        request.part_needed
                      }
                    </p>

                    <p>
                      <strong>
                        Preference:
                      </strong>{" "}
                      {
                        request.part_preference
                      }
                    </p>

                  </div>

                </div>

                {request.extra_details && (
                  <div className="mt-4 bg-gray-50 p-3 rounded-xl text-sm">

                    <p className="font-bold mb-1">
                      Extra Details
                    </p>

                    <p>
                      {
                        request.extra_details
                      }
                    </p>

                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">

                  <button
                    onClick={() =>
                      router.push(
                        `/quotes/${request.id}`
                      )
                    }
                    className="bg-black text-white px-4 py-2 rounded-xl text-sm"
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
                    className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm"
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
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm"
                  >
                    Email
                  </button>

                </div>

                {request.photo_url && (
                  <div className="mt-4">

                    <p className="font-bold text-sm mb-2">
                      Uploaded Photo
                    </p>

                    <img
                      src={
                        request.photo_url
                      }
                      alt="Uploaded"
                      className="w-64 rounded-xl border"
                    />

                  </div>
                )}

              </div>
            )
          )}

        </div>

      </div>

    </main>
  );
}
