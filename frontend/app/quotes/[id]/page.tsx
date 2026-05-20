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

  const [selectedSupplier, setSelectedSupplier] =
    useState("");

  const [supplierPrice, setSupplierPrice] =
    useState("");

  const [availability, setAvailability] =
    useState("");

  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchSuppliers();
    fetchQuotes();
  }, []);

  async function fetchSuppliers() {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("active", true)
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setSuppliers(data || []);
  }

  async function fetchQuotes() {
    const { data, error } = await supabase
      .from("supplier_quotes")
      .select(`
        *,
        suppliers (
          name
        ),
        parts_requests (
          customer_name,
          phone_number,
          email,
          vehicle_make,
          vehicle_model,
          vehicle_year,
          part_needed
        )
      `)
      .eq("request_id", requestId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setQuotes(data || []);
  }

  async function saveQuote() {
    if (
      !selectedSupplier ||
      !supplierPrice
    ) {
      alert(
        "Supplier and supplier price required"
      );
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
          marked_up_price:
            markedUpPrice.toFixed(2),
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

  function generateQuoteText() {
    if (quotes.length === 0) {
      return "";
    }

    const customer =
      quotes[0]?.parts_requests;

    return `Hi ${
      customer?.customer_name ||
      "Customer"
    },

We found the following aftermarket options for your request:

Vehicle:
${customer?.vehicle_make || ""}
${customer?.vehicle_model || ""}
${customer?.vehicle_year || ""}

Part Requested:
${customer?.part_needed || ""}

${quotes
  .map(
    (quote, index) => `
OPTION ${index + 1}

Brand/Supplier:
${quote.suppliers?.name}

Price:
R${quote.marked_up_price}

Availability:
${quote.availability || "Available on request"}

Notes:
${quote.notes || "Aftermarket replacement part"}

-----------------------------------
`
  )
  .join("\n")}

Please let us know which option you'd like to proceed with.

All pricing includes sourcing and handling.

Thank you,
Cape Parts Finder`;
  }

  function copyQuote() {
    if (quotes.length === 0) {
      alert("No quotes to copy");
      return;
    }

    navigator.clipboard.writeText(
      generateQuoteText()
    );

    alert("Quote copied to clipboard");
  }

  function openCustomerWhatsApp() {
    if (quotes.length === 0) {
      alert("No quotes available");
      return;
    }

    const customer =
      quotes[0]?.parts_requests;

    if (!customer?.phone_number) {
      alert(
        "Customer phone number missing"
      );
      return;
    }

    const cleanNumber =
      customer.phone_number.replace(
        /\D/g,
        ""
      );

    const message =
      encodeURIComponent(
        generateQuoteText()
      );

    window.open(
      `https://wa.me/${cleanNumber}?text=${message}`
    );
  }

  function sendCustomerEmail() {
    if (quotes.length === 0) {
      alert("No quotes available");
      return;
    }

    const customer =
      quotes[0]?.parts_requests;

    if (!customer?.email) {
      alert("Customer email missing");
      return;
    }

    const subject =
      encodeURIComponent(
        "Cape Parts Finder Quote"
      );

    const body =
      encodeURIComponent(
        generateQuoteText()
      );

    window.open(
      `mailto:${customer.email}?subject=${subject}&body=${body}`
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">

      <header className="bg-black text-white px-6 py-4 flex justify-between items-center">

        <h1 className="text-2xl font-bold">
          Supplier Quotes
        </h1>

        <button
          onClick={() =>
            router.push("/admin")
          }
          className="bg-gray-700 px-4 py-2 rounded-xl"
        >
          Back to Admin
        </button>

      </header>

      <div className="max-w-6xl mx-auto p-6">

        <div className="bg-white rounded-2xl shadow p-6 mb-8">

          <h2 className="text-xl font-bold mb-4">
            Add Supplier Quote
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <select
              value={selectedSupplier}
              onChange={(e) =>
                setSelectedSupplier(
                  e.target.value
                )
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
                setSupplierPrice(
                  e.target.value
                )
              }
              className="border p-3 rounded-xl"
            />

            <input
              placeholder="Availability"
              value={availability}
              onChange={(e) =>
                setAvailability(
                  e.target.value
                )
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

        <div className="bg-white rounded-2xl shadow p-6 mb-8">

          <h2 className="text-xl font-bold mb-4">
            Contact Suppliers
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            {suppliers.map((supplier) => {

              const message =
                encodeURIComponent(
`Hi,

Looking for price and availability please.

Request ID: ${requestId}

Please send:
- Price
- Availability
- Warranty if any

Thanks,
Cape Parts Finder`
                );

              return (
                <div
                  key={supplier.id}
                  className="border rounded-2xl p-4 flex justify-between items-center"
                >

                  <div>

                    <h3 className="font-bold">
                      {supplier.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {
                        supplier.whatsapp_number
                      }
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      window.open(
                        `https://wa.me/${supplier.whatsapp_number}?text=${message}`
                      )
                    }
                    className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm"
                  >
                    Request Quote
                  </button>

                </div>
              );
            })}

          </div>

        </div>

        <div className="bg-white rounded-2xl shadow p-6 mb-8">

          <div className="flex flex-wrap gap-4 justify-between items-center mb-4">

            <h2 className="text-xl font-bold">
              Customer Quote Preview
            </h2>

            <div className="flex flex-wrap gap-3">

              <button
                onClick={copyQuote}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm"
              >
                Copy Quote
              </button>

              <button
                onClick={
                  openCustomerWhatsApp
                }
                className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm"
              >
                Send WhatsApp
              </button>

              <button
                onClick={sendCustomerEmail}
                className="bg-black text-white px-4 py-2 rounded-xl text-sm"
              >
                Send Email
              </button>

            </div>

          </div>

          <div className="bg-gray-100 rounded-xl p-4 whitespace-pre-wrap text-sm">

            {quotes.length === 0
              ? "No quotes added yet."
              : generateQuoteText()}

          </div>

        </div>

        <div className="space-y-4">

          {quotes.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
              No supplier quotes added yet.
            </div>
          )}

          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white rounded-2xl shadow p-6"
            >

              <div className="flex justify-between">

                <div>

                  <h2 className="text-xl font-bold">
                    {
                      quote.suppliers?.name
                    }
                  </h2>

                  <p className="mt-2">
                    <strong>
                      Supplier Price:
                    </strong>{" "}
                    R
                    {quote.supplier_price}
                  </p>

                  <p>
                    <strong>
                      Your Price:
                    </strong>{" "}
                    R
                    {quote.marked_up_price}
                  </p>

                  <p>
                    <strong>
                      Availability:
                    </strong>{" "}
                    {quote.availability ||
                      "-"}
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
