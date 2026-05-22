"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function QuotesPage() {
  const params = useParams();
  const router = useRouter();

  const requestId = params.id;

  const [request, setRequest] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [price, setPrice] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    await fetchRequest();
    await fetchQuotes();
    await fetchSuppliers();
  }

  async function fetchRequest() {
    const { data } = await supabase
      .from("parts_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (data) {
      setRequest(data);
    }
  }

  async function fetchQuotes() {
    const { data } = await supabase
      .from("supplier_quotes")
      .select(`
        *,
        suppliers (
          name,
          whatsapp_number
        )
      `)
      .eq("request_id", requestId)
      .order("created_at", {
        ascending: false,
      });

    if (data) {
      setQuotes(data);
    }
  }

  async function fetchSuppliers() {
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("active", true)
      .order("name");

    if (data) {
      setSuppliers(data);
    }
  }

  async function saveQuote() {
    if (!supplierId || !price) {
      alert("Supplier and price required");
      return;
    }

    const numericPrice = Number(price);

    const sellPrice = (
      numericPrice * 1.2
    ).toFixed(2);

    const { error } = await supabase
      .from("supplier_quotes")
      .insert([
        {
          request_id: requestId,
          supplier_id: supplierId,
          price: numericPrice,
          sell_price: sellPrice,
          note,
        },
      ]);

    if (error) {
      alert("Failed to save quote");
      return;
    }

    await supabase
      .from("parts_requests")
      .update({
        status: "Quoted",
      })
      .eq("id", requestId);

    setPrice("");
    setSupplierId("");
    setNote("");

    fetchQuotes();
    fetchRequest();
  }

  async function deleteQuote(id: number) {
    const confirmed = confirm(
      "Delete this quote?"
    );

    if (!confirmed) return;

    await supabase
      .from("supplier_quotes")
      .delete()
      .eq("id", id);

    fetchQuotes();
  }

  async function convertToSale(
    quote: any
  ) {
    const confirmed = confirm(
      "Convert this quote into a sale?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("sales")
      .insert([
        {
          request_id: request.id,
          supplier_quote_id: quote.id,
          customer_name:
            request.customer_name,
          vehicle:
            request.vehicle_make +
            " " +
            request.vehicle_model,
          part_name:
            request.part_needed,
          cost_price: quote.price,
          sell_price:
            quote.sell_price,
          profit:
            Number(
              quote.sell_price
            ) - Number(quote.price),
          status: "Pending",
        },
      ]);

    if (error) {
      alert("Failed to create sale");
      return;
    }

    await supabase
      .from("parts_requests")
      .update({
        status: "Ordered",
      })
      .eq("id", request.id);

    alert("Sale created");

    router.push("/sales");
  }

  function sendCustomerWhatsApp(
    quote: any
  ) {
    const message = `Hi ${request.customer_name},

We found your requested part.

Vehicle:
${request.vehicle_make} ${request.vehicle_model}

Part:
${request.part_needed}

Price:
R${quote.sell_price}

Please reply if you'd like us to proceed.

Cape Parts Finder`;

    const phone =
      request.phone_number.replace(
        /\D/g,
        ""
      );

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(
        message
      )}`
    );
  }

  if (!request) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">

      <header className="bg-black text-white px-6 py-4 flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold">
            Supplier Quotes
          </h1>

          <p className="text-sm text-gray-400">
            {request.vehicle_make}{" "}
            {request.vehicle_model}
          </p>
        </div>

        <button
          onClick={() =>
            router.push("/admin")
          }
          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm transition"
        >
          Back
        </button>

      </header>

      <div className="max-w-5xl mx-auto p-6">

        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">

          <h2 className="text-xl font-semibold mb-4">
            Add Supplier Quote
          </h2>

          <div className="grid md:grid-cols-3 gap-4">

            <select
              value={supplierId}
              onChange={(e) =>
                setSupplierId(
                  e.target.value
                )
              }
              className="border rounded-xl p-3"
            >
              <option value="">
                Select Supplier
              </option>

              {suppliers.map(
                (supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                  >
                    {supplier.name}
                  </option>
                )
              )}
            </select>

            <input
              type="number"
              placeholder="Cost Price"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
              }
              className="border rounded-xl p-3"
            />

            <input
              type="text"
              placeholder="Note"
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
              className="border rounded-xl p-3"
            />

          </div>

          {price && (
            <div className="mt-4 bg-gray-50 border rounded-xl p-4">

              <p className="text-sm text-gray-500">
                Supplier Cost
              </p>

              <p className="text-xl font-bold">
                R{price}
              </p>

              <p className="text-sm text-gray-500 mt-3">
                Customer Price
                (20% Markup)
              </p>

              <p className="text-2xl font-bold text-green-600">
                R
                {(
                  Number(price) * 1.2
                ).toFixed(2)}
              </p>

            </div>
          )}

          <button
            onClick={saveQuote}
            className="mt-4 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl transition"
          >
            Save Quote
          </button>

        </div>

        <div className="space-y-4">

          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white rounded-2xl shadow-sm border p-6"
            >

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>

                  <h2 className="text-xl font-semibold">
                    {
                      quote.suppliers?.name
                    }
                  </h2>

                  <div className="mt-3 space-y-1">

                    <p className="text-sm text-gray-500">
                      Supplier Cost
                    </p>

                    <p className="text-xl font-bold">
                      R{quote.price}
                    </p>

                    <p className="text-sm text-gray-500 mt-3">
                      Customer Price
                    </p>

                    <p className="text-3xl font-bold text-green-600">
                      R
                      {quote.sell_price}
                    </p>

                  </div>

                  {quote.note && (
                    <p className="text-gray-500 mt-4">
                      {quote.note}
                    </p>
                  )}

                </div>

                <div className="flex flex-col gap-3">

                  <button
                    onClick={() =>
                      sendCustomerWhatsApp(
                        quote
                      )
                    }
                    className="bg-black text-white px-5 py-3 rounded-xl text-sm hover:bg-gray-800 transition"
                  >
                    Send To Customer
                  </button>

                  <button
                    onClick={() =>
                      convertToSale(
                        quote
                      )
                    }
                    className="border border-gray-300 px-5 py-3 rounded-xl text-sm hover:bg-gray-100 transition"
                  >
                    Convert To Sale
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        "https://wa.me/" +
                          quote.suppliers?.whatsapp_number?.replace(
                            /\D/g,
                            ""
                          )
                      )
                    }
                    className="border border-gray-300 px-5 py-3 rounded-xl text-sm hover:bg-gray-100 transition"
                  >
                    WhatsApp Supplier
                  </button>

                  <button
                    onClick={() =>
                      deleteQuote(
                        quote.id
                      )
                    }
                    className="border border-red-200 text-red-500 hover:bg-red-50 px-5 py-3 rounded-xl text-sm transition"
                  >
                    Delete Quote
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