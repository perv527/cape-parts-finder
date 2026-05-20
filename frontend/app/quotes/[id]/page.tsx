"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function QuotesPage() {
  const params = useParams();
  const router = useRouter();

  const requestId = params.id;

  const [quotes, setQuotes] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [supplierPrice, setSupplierPrice] = useState("");
  const [availability, setAvailability] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchSuppliers();
    fetchQuotes();
  }, []);

  async function fetchSuppliers() {
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("active", true);

    setSuppliers(data || []);
  }

  async function fetchQuotes() {
    const { data } = await supabase
      .from("supplier_quotes")
      .select(`
        *,
        suppliers (
          name
        )
      `)
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });

    setQuotes(data || []);
  }

  async function saveQuote() {
    if (!selectedSupplier || !supplierPrice) {
      alert("Supplier and price required");
      return;
    }

    const markedUpPrice =
      Number(supplierPrice) * 1.2;

    const { error } = await supabase
      .from("supplier_quotes")
      .insert([
        {
          request_id: requestId,
          supplier_id: selectedSupplier,
          supplier_price: supplierPrice,
          marked_up_price: markedUpPrice,
          availability,
          notes,
        },
      ]);

    if (error) {
      console.error(error);
      alert("Failed to save quote");
      return;
    }

    setSelectedSupplier("");
    setSupplierPrice("");
    setAvailability("");
    setNotes("");

    fetchQuotes();
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-black text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Supplier Quotes
        </h1>

        <button
          onClick={() => router.push("/admin")}
          className="bg-gray-700 px-4 py-2 rounded-xl"
        >
          Back to Admin
        </button>
      </header>

      <div className="max-w-5xl mx-auto p-6">

        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            Add Supplier Quote
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <select
              value={selectedSupplier}
              onChange={(e) =>
                setSelectedSupplier(e.target.value)
              }
              className="border p-3 rounded-xl"
            >
              <option value="">
                Select Supplier
              </option>

              {suppliers.map((supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Supplier Price"
              value={supplierPrice}
              onChange={(e) =>
                setSupplierPrice(e.target.value)
              }
              className="border p-3 rounded-xl"
            />

            <input
              placeholder="Availability"
              value={availability}
              onChange={(e) =>
                setAvailability(e.target.value)
              }
              className="border p-3 rounded-xl"
            />

            <input
              placeholder="Notes"
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              className="border p-3 rounded-xl"
            />
          </div>

          <button
            onClick={saveQuote}
            className="bg-black text-white px-6 py-3 rounded-xl mt-4"
          >
            Save Quote
          </button>
        </div>

        <div className="space-y-4">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white rounded-2xl shadow p-6"
            >
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {quote.suppliers?.name}
                  </h2>

                  <p>
                    <strong>Supplier Price:</strong> R
                    {quote.supplier_price}
                  </p>

                  <p>
                    <strong>Your Price:</strong> R
                    {quote.marked_up_price}
                  </p>

                  <p>
                    <strong>Availability:</strong>{" "}
                    {quote.availability || "-"}
                  </p>

                  <p>
                    <strong>Notes:</strong>{" "}
                    {quote.notes || "-"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
