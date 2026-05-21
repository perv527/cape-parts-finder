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
  const [request, setRequest] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [supplierPrice, setSupplierPrice] = useState("");
  const [availability, setAvailability] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
      fetchRequest();
      fetchSuppliers();
      fetchQuotes();
    });
  }, []);

  async function fetchRequest() {
    const { data } = await supabase
      .from("parts_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    setRequest(data);
  }

  async function fetchSuppliers() {
    const { data } = await supabase
      .from("suppliers")
      .select("*")
      .eq("active", true)
      .order("name");
    setSuppliers(data || []);
  }

  async function fetchQuotes() {
    const { data } = await supabase
      .from("supplier_quotes")
      .select("*, suppliers(name)")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });
    setQuotes(data || []);
  }

  async function saveQuote() {
    if (!selectedSupplier || !supplierPrice) {
      alert("Supplier and price are required.");
      return;
    }
    const markedUpPrice = (Number(supplierPrice) * 1.2).toFixed(2);
    const { error } = await supabase
      .from("supplier_quotes")
      .insert([{
        request_id: requestId,
        supplier_id: selectedSupplier,
        supplier_price: supplierPrice,
        marked_up_price: markedUpPrice,
        availability,
        notes,
      }]);
    if (error) {
      alert("Failed to save quote.");
      return;
    }
    setSelectedSupplier("");
    setSupplierPrice("");
    setAvailability("");
    setNotes("");
    fetchQuotes();
  }

  async function deleteQuote(id: number) {
    if (!confirm("Delete this quote?")) return;
    await supabase.from("supplier_quotes").delete().eq("id", id);
    fetchQuotes();
  }

  async function convertToSale(quote: any) {
    const supplierPrice = Number(quote.supplier_price);
    const sellingPrice = Number(quote.marked_up_price);
    const profit = sellingPrice - supplierPrice;
    const { error } = await supabase
      .from("sales")
      .insert([{
        request_id: requestId,
        supplier_quote_id: quote.id,
        customer_name: request?.customer_name,
        customer_phone: request?.phone_number,
        supplier_price: supplierPrice,
        selling_price: sellingPrice,
        profit,
        status: "Completed",
      }]);
    if (error) {
      alert("Failed to convert to sale.");
      return;
    }
    await supabase
      .from("parts_requests")
      .update({ status: "Ordered" })
      .eq("id", requestId);
    alert("Sale saved successfully!");
  }

  function generateQuoteText() {
    if (quotes.length === 0) return "";
    return `Hi ${request?.customer_name || "Customer"},

We found the following options for your request:

Vehicle: ${request?.vehicle_make} ${request?.vehicle_model} ${request?.vehicle_year}
Part Requested: ${request?.part_needed}

${quotes.map((quote, index) => `OPTION ${index + 1}
Supplier: ${quote.suppliers?.name}
Price: R${quote.marked_up_price}
Availability: ${quote.availability || "Available on request"}
Notes: ${quote.notes || "Aftermarket replacement part"}
-----------------------------------`).join("\n\n")}

Please let us know which option you would like to proceed with.

Thank you,
Cape Parts Finder`;
  }

  function copyQuote() {
    if (quotes.length === 0) {
      alert("No quotes to copy.");
      return;
    }
    navigator.clipboard.writeText(generateQuoteText());
    alert("Quote copied to clipboard!");
  }

  function sendWhatsApp() {
    if (!request?.phone_number) {
      alert("Customer phone number missing.");
      return;
    }
    const clean = request.phone_number.replace(/\D/g, "");
    const message = encodeURIComponent(generateQuoteText());
    window.open("https://wa.me/" + clean + "?text=" + message);
  }

  function sendEmail() {
    if (!request?.email) {
      alert("Customer email missing.");
      return;
    }
    const subject = encodeURIComponent("Cape Parts Finder Quote");
    const body = encodeURIComponent(generateQuoteText());
    window.open("mailto:" + request.email + "?subject=" + subject + "&body=" + body);
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-black text-white px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Supplier Quotes</h1>
          {request && (
            <p className="text-xs text-gray-400">
              {request.customer_name} — {request.vehicle_make} {request.vehicle_model} — {request.part_needed}
            </p>
          )}
        </div>
        <button onClick={() => router.push("/admin")} className="bg-gray-700 px-4 py-2 rounded-xl text-sm">
          Back to Admin
        </button>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Contact Suppliers</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {suppliers.map((supplier) => {
              const message = encodeURIComponent(
                "Hi, looking for price and availability please.\n\nPart: " +
                (request?.part_needed || "") +
                "\nVehicle: " + (request?.vehicle_make || "") +
                " " + (request?.vehicle_model || "") +
                " " + (request?.vehicle_year || "") +
                "\nVIN: " + (request?.vin_number || "") +
                "\n\nPlease send price, availability and warranty.\n\nThanks, Cape Parts Finder"
              );
              return (
                <div key={supplier.id} className="border rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{supplier.name}</h3>
                    <p className="text-sm text-gray-500">{supplier.whatsapp_number}</p>
                    <p className="text-xs text-gray-400">{supplier.area}</p>
                  </div>
                  <button
                    onClick={() => window.open("https://wa.me/" + supplier.whatsapp_number.replace(/\D/g, "") + "?text=" + message)}
                    className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm"
                  >
                    Request Quote
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Add Supplier Quote</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="border p-3 rounded-xl">
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input type="number" placeholder="Supplier Price (R)" value={supplierPrice} onChange={(e) => setSupplierPrice(e.target.value)} className="border p-3 rounded-xl" />
            <input placeholder="Availability (e.g. In stock, 2 days)" value={availability} onChange={(e) => setAvailability(e.target.value)} className="border p-3 rounded-xl" />
            <input placeholder="Notes (e.g. OEM quality, warranty)" value={notes} onChange={(e) => setNotes(e.target.value)} className="border p-3 rounded-xl" />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">
              {supplierPrice ? "Your selling price: R" + (Number(supplierPrice) * 1.2).toFixed(2) + " (20% markup)" : "Enter supplier price to see markup"}
            </p>
            <button onClick={saveQuote} className="bg-black text-white px-6 py-3 rounded-xl font-bold">Save Quote</button>
          </div>
        </div>

        {quotes.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Customer Quote Preview</h2>
              <div className="flex flex-wrap gap-3">
                <button onClick={copyQuote} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm">Copy Quote</button>
                <button onClick={sendWhatsApp} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm">Send WhatsApp</button>
                <button onClick={sendEmail} className="bg-black text-white px-4 py-2 rounded-xl text-sm">Send Email</button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 whitespace-pre-wrap text-sm font-mono">
              {generateQuoteText()}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Saved Quotes ({quotes.length})</h2>
          {quotes.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">
              No quotes added yet. Add supplier quotes above.
            </div>
          )}
          {quotes.map((quote) => (
            <div key={quote.id} className="bg-white rounded-2xl shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{quote.suppliers?.name}</h3>
                  <p className="mt-2 text-sm"><strong>Supplier Price:</strong> R{quote.supplier_price}</p>
                  <p className="text-sm"><strong>Your Selling Price:</strong> R{quote.marked_up_price}</p>
                  <p className="text-sm"><strong>Profit:</strong> R{(Number(quote.marked_up_price) - Number(quote.supplier_price)).toFixed(2)}</p>
                  <p className="text-sm"><strong>Availability:</strong> {quote.availability || "-"}</p>
                  <p className="text-sm"><strong>Notes:</strong> {quote.notes || "-"}</p>
                </div>
                <button onClick={() => deleteQuote(quote.id)} className="text-red-400 border border-red-200 px-3 py-2 rounded-xl text-sm">Delete</button>
              </div>
              <div className="mt-4">
                <button onClick={() => convertToSale(quote)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Convert To Sale</button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
