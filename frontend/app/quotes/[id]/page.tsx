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

  // Add quote form
  const [price, setPrice] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [quoteImage, setQuoteImage] = useState<File | null>(null);
  const [uploadingQuote, setUploadingQuote] = useState(false);
  const [markup, setMarkup] = useState("20");

  // Supplier confirmation image upload
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [confirmImage, setConfirmImage] = useState<File | null>(null);
  const [confirmNote, setConfirmNote] = useState("");
  const [uploadingConfirm, setUploadingConfirm] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    await fetchRequest();
    await fetchQuotes();
    await fetchSuppliers();
  }

  async function fetchRequest() {
    const { data } = await supabase
      .from("parts_requests").select("*").eq("id", requestId).single();
    if (data) setRequest(data);
  }

  async function fetchQuotes() {
    const { data } = await supabase
      .from("supplier_quotes")
      .select(`*, suppliers (name, whatsapp_number)`)
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });
    if (data) setQuotes(data);
  }

  async function fetchSuppliers() {
    const { data } = await supabase
      .from("suppliers").select("*").eq("active", true).order("name");
    if (data) setSuppliers(data);
  }

  async function uploadImage(file: File, folder: string) {
    const ext = file.name.split(".").pop();
    const fileName = `${folder}/${requestId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("quote-images").upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("quote-images").getPublicUrl(fileName);
    return publicUrl;
  }

  async function saveQuote() {
    if (!supplierId || !price) { alert("Supplier and price required"); return; }
    setUploadingQuote(true);
    try {
      let imageUrl = null;
      try { if (quoteImage) imageUrl = await uploadImage(quoteImage, "quote-requests"); } catch(e) { console.error(e); }

      const numericPrice = Number(price);
      const sellPrice = (numericPrice * (1 + Number(markup) / 100)).toFixed(2);

      const { error } = await supabase.from("supplier_quotes").insert([{
        request_id: requestId,
        supplier_id: supplierId,
        supplier_price: numericPrice,
        marked_up_price: sellPrice,
        notes: note,
        quote_image_url: imageUrl,
      }]);

      if (error) { alert("Failed to save quote"); return; }

      await supabase.from("parts_requests").update({ status: "Quoted" }).eq("id", requestId);

      setPrice(""); setSupplierId(""); setNote(""); setQuoteImage(null);
      fetchQuotes(); fetchRequest();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setUploadingQuote(false);
  }

  async function saveSupplierConfirmation() {
    if (!confirmImage) { alert("Please attach the supplier confirmation image"); return; }
    setUploadingConfirm(true);
    try {
      const imageUrl = await uploadImage(confirmImage, "supplier-confirmations");
      await supabase.from("supplier_quotes").update({
        supplier_confirmation_image: imageUrl,
        supplier_confirmation_note: confirmNote,
        supplier_confirmed: true,
      }).eq("id", confirmModal.id);

      setConfirmModal(null); setConfirmImage(null); setConfirmNote("");
      fetchQuotes();
    } catch (err) {
      alert("Failed to upload confirmation image");
    }
    setUploadingConfirm(false);
  }

  async function deleteQuote(id: number) {
    if (!confirm("Delete this quote?")) return;
    await supabase.from("supplier_quotes").delete().eq("id", id);
    fetchQuotes();
  }

  async function convertToSale(quote: any) {
    if (!confirm("Convert this quote into a sale?")) return;
    const { error } = await supabase.from("sales").insert([{
      request_id: request.id,
      supplier_quote_id: quote.id,
      customer_name: request.customer_name,
      customer_phone: request.phone_number,
      supplier_price: quote.supplier_price,
      selling_price: quote.marked_up_price,
      profit: Number(quote.marked_up_price) - Number(quote.supplier_price),
      status: "Completed",
    }]);
    if (error) { alert("Failed to create sale"); return; }
    await supabase.from("parts_requests").update({ status: "Ordered" }).eq("id", request.id);
    alert("Sale created!");
    router.push("/sales");
  }

  function sendCustomerWhatsApp(quote: any) {
    const message = `Hi ${request.customer_name},\n\nWe found your requested part!\n\nVehicle: ${request.vehicle_make} ${request.vehicle_model}\nPart: ${request.part_needed}\n\nPrice: R${quote.marked_up_price}\n\nPlease reply to confirm and we will proceed.\n\nCape Parts Finder`;
    const phone = request.phone_number.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
  }

  function sendCustomerWhatsAppWithImage(quote: any) {
    const imageUrl = quote.supplier_confirmation_image || quote.quote_image_url;
    const message = `Hi ${request.customer_name},\n\nHere is the confirmation for your part:\n\nVehicle: ${request.vehicle_make} ${request.vehicle_model}\nPart: ${request.part_needed}\nPrice: R${quote.marked_up_price}\n\nImage: ${imageUrl}\n\nPlease confirm to proceed.\n\nCape Parts Finder`;
    const phone = request.phone_number.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
  }

  if (!request) {
    return (
      <main className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="bg-white px-10 py-7 rounded-2xl border border-gray-100 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <p className="text-gray-700 text-base font-medium">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9]">

      {/* â”€â”€ TOP NAV â”€â”€ */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-orange-500 flex items-center justify-center flex-shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-[15px] text-gray-900 leading-tight">Cape Parts Finder</div>
              <div className="text-[11px] text-gray-400">Supplier Quotes</div>
            </div>
          </div>
          <div className="flex gap-1">
            <a href="/admin"     className="px-4 py-1.5 rounded-lg text-sm no-underline text-gray-500 hover:bg-gray-50">Requests</a>
            <a href="/suppliers" className="px-4 py-1.5 rounded-lg text-sm no-underline text-gray-500 hover:bg-gray-50">Suppliers</a>
            <a href="/sales"     className="px-4 py-1.5 rounded-lg text-sm no-underline text-gray-500 hover:bg-gray-50">Sales</a>
          </div>
          <button onClick={() => router.push("/admin")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-[13px] font-medium hover:bg-gray-50 transition cursor-pointer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Requests
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-7">

        {/* â”€â”€ REQUEST SUMMARY â”€â”€ */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-[16px] flex-shrink-0">
                {(request.customer_name || "?")[0].toUpperCase()}
              </div>
              <div>
                <h1 className="font-bold text-[18px] text-gray-900">{request.customer_name}</h1>
                <p className="text-[13px] text-gray-400 mt-0.5">
                  {request.vehicle_year} {request.vehicle_make} {request.vehicle_model} Â· {request.part_needed}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => window.open("https://wa.me/" + request.phone_number.replace(/\D/g, ""))}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition cursor-pointer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                WhatsApp Customer
              </button>
            </div>
          </div>

          {/* Customer photo if uploaded */}
          {request.photo_url && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer Photo</p>
              <img src={request.photo_url} alt="Customer upload" className="w-48 rounded-xl border border-gray-200" />
            </div>
          )}
        </div>

        {/* â”€â”€ ADD QUOTE FORM â”€â”€ */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
          <h2 className="font-bold text-[16px] text-gray-900 mb-4">Add Supplier Quote</h2>

          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-300 cursor-pointer">
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input type="number" placeholder="Cost Price (R)"
              value={price} onChange={(e) => setPrice(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-300" />
            <input type="text" placeholder="Note (optional)"
              value={note} onChange={(e) => setNote(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-300" />
          </div>

          {/* Image upload for quote */}
          <div className="mb-3">
            <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide block mb-2">
              Attach Image to Send Supplier (optional)
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-orange-300 transition cursor-pointer"
              onClick={() => document.getElementById("quote-img")?.click()}>
              {quoteImage ? (
                <div className="flex items-center justify-center gap-3">
                  <img src={URL.createObjectURL(quoteImage)} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">{quoteImage.name}</p>
                    <p className="text-[12px] text-gray-400">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span className="text-sm">Click to attach image</span>
                </div>
              )}
            </div>
            <input id="quote-img" type="file" accept="image/*" className="hidden"
              onChange={(e) => setQuoteImage(e.target.files?.[0] || null)} />
          </div>

          {/* Price preview */}
          {price && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Markup %</p>
                  <div className="flex items-center gap-2">
                    <input type="number" value={markup} onChange={(e) => setMarkup(e.target.value)}
                      className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-orange-600 outline-none focus:border-orange-300 text-center"
                      min="0" max="200" />
                    <span className="text-gray-400 text-sm">%</span>
                    <div className="flex gap-1">
                      {["10","15","20","25","30"].map(m => (
                        <button key={m} type="button" onClick={() => setMarkup(m)}
                          className={`px-2 py-1 rounded text-xs font-medium cursor-pointer border transition ${markup === m ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-500 border-gray-200 hover:border-orange-300"}`}>
                          {m}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-gray-100 rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Supplier Cost</p>
                  <p className="text-[20px] font-bold text-gray-900 mt-1">R{Number(price).toFixed(2)}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Markup Amount</p>
                  <p className="text-[20px] font-bold text-orange-500 mt-1">R{(Number(price) * Number(markup) / 100).toFixed(2)}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wide">Customer Price</p>
                  <p className="text-[20px] font-bold text-green-700 mt-1">R{(Number(price) * (1 + Number(markup) / 100)).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <button onClick={saveQuote} disabled={uploadingQuote}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold transition cursor-pointer">
            {uploadingQuote ? "Saving..." : "Save Quote"}
          </button>
        </div>

        {/* â”€â”€ QUOTES LIST â”€â”€ */}
        <div className="space-y-4">
          {quotes.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-gray-400 text-sm">
              No quotes yet â€” add one above
            </div>
          )}

          {quotes.map((quote) => (
            <div key={quote.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Quote header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-[16px] text-gray-900">{quote.suppliers?.name}</h2>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {new Date(quote.created_at).toLocaleString("en-ZA")}
                  </p>
                </div>
                {quote.supplier_confirmed && (
                  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full text-[12px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Supplier Confirmed
                  </span>
                )}
              </div>

              <div className="p-5">
                {/* Prices */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Supplier Cost</p>
                    <p className="text-[22px] font-bold text-gray-900 mt-1">R{quote.supplier_price}</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wide">Customer Price</p>
                    <p className="text-[22px] font-bold text-green-700 mt-1">R{quote.marked_up_price}</p>
                  </div>
                </div>

                {quote.notes && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4">
                    <p className="text-[12px] font-semibold text-orange-700 mb-1">Note</p>
                    <p className="text-sm text-gray-700">{quote.note}</p>
                  </div>
                )}

                {/* â”€â”€ IMAGE FLOW â”€â”€ */}
                <div className="grid md:grid-cols-3 gap-3 mb-4">

                  {/* Your quote image sent to supplier */}
                  {quote.quote_image_url && (
                    <div className="border border-gray-100 rounded-xl p-3">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        ðŸ“¤ Sent to Supplier
                      </p>
                      <img src={quote.quote_image_url} alt="Quote sent" className="w-full rounded-lg border border-gray-200 cursor-pointer"
                        onClick={() => window.open(quote.quote_image_url)} />
                    </div>
                  )}

                  {/* Supplier confirmation image */}
                  {quote.supplier_confirmation_image && (
                    <div className="border border-green-100 rounded-xl p-3 bg-green-50">
                      <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wide mb-2">
                        âœ… Supplier Confirmed
                      </p>
                      <img src={quote.supplier_confirmation_image} alt="Supplier confirmation" className="w-full rounded-lg border border-green-200 cursor-pointer"
                        onClick={() => window.open(quote.supplier_confirmation_image)} />
                      {quote.supplier_confirmation_note && (
                        <p className="text-[12px] text-gray-600 mt-2">{quote.supplier_confirmation_note}</p>
                      )}
                    </div>
                  )}

                  {/* Customer photo from original request */}
                  {request.photo_url && (
                    <div className="border border-blue-100 rounded-xl p-3 bg-blue-50">
                      <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide mb-2">
                        ðŸ“· Customer Photo
                      </p>
                      <img src={request.photo_url} alt="Customer photo" className="w-full rounded-lg border border-blue-200 cursor-pointer"
                        onClick={() => window.open(request.photo_url)} />
                    </div>
                  )}
                </div>

                {/* â”€â”€ ACTION BUTTONS â”€â”€ */}
                <div className="flex flex-wrap gap-2.5">

                  {/* Send to customer via WhatsApp */}
                  <button onClick={() => sendCustomerWhatsApp(quote)}
                    className="bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
                    Send to Customer
                  </button>

                  {/* Send confirmation image to customer */}
                  {quote.supplier_confirmation_image && (
                    <button onClick={() => sendCustomerWhatsAppWithImage(quote)}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      Send Confirmation to Customer
                    </button>
                  )}

                  {/* Upload supplier confirmation */}
                  {!quote.supplier_confirmed && (
                    <button onClick={() => { setConfirmModal(quote); setConfirmImage(null); setConfirmNote(""); }}
                      className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload Supplier Confirmation
                    </button>
                  )}

                  {/* WhatsApp supplier */}
                  <button onClick={() => window.open("https://wa.me/" + quote.suppliers?.whatsapp_number?.replace(/\D/g, ""))}
                    className="flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    WhatsApp Supplier
                  </button>

                  {/* Convert to sale */}
                  <button onClick={() => convertToSale(quote)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
                    Convert to Sale
                  </button>

                  {/* Delete */}
                  <button onClick={() => deleteQuote(quote.id)}
                    className="ml-auto flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 px-4 py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ SUPPLIER CONFIRMATION MODAL â”€â”€ */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[16px] text-gray-900">Supplier Confirmation</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">From: {confirmModal.suppliers?.name}</p>
              </div>
              <button onClick={() => setConfirmModal(null)} className="text-gray-400 hover:text-gray-700 text-xl cursor-pointer bg-transparent border-none">Ã—</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  Supplier Confirmation Image *
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-orange-300 transition cursor-pointer"
                  onClick={() => document.getElementById("confirm-img")?.click()}>
                  {confirmImage ? (
                    <div>
                      <img src={URL.createObjectURL(confirmImage)} alt="Preview" className="w-full max-h-48 object-contain rounded-lg mb-2" />
                      <p className="text-[12px] text-gray-500">{confirmImage.name}</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="mx-auto mb-2 text-gray-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <p className="text-sm text-gray-400">Click to upload supplier confirmation image</p>
                    </div>
                  )}
                </div>
                <input id="confirm-img" type="file" accept="image/*" className="hidden"
                  onChange={(e) => setConfirmImage(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                  Note from Supplier (optional)
                </label>
                <textarea value={confirmNote} onChange={(e) => setConfirmNote(e.target.value)}
                  placeholder="e.g. Part available, delivery 2 days..."
                  rows={3} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-orange-300 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={saveSupplierConfirmation} disabled={uploadingConfirm || !confirmImage}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white py-2.5 rounded-lg text-[13px] font-semibold transition cursor-pointer">
                  {uploadingConfirm ? "Saving..." : "Save Confirmation"}
                </button>
                <button onClick={() => setConfirmModal(null)}
                  className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}











