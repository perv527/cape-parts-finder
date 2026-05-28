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
  const [quoteImage, setQuoteImage] = useState<File | null>(null);
  const [uploadingQuote, setUploadingQuote] = useState(false);
  const [markup, setMarkup] = useState("20");

  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [confirmImage, setConfirmImage] = useState<File | null>(null);
  const [confirmNote, setConfirmNote] = useState("");
  const [uploadingConfirm, setUploadingConfirm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editMarkup, setEditMarkup] = useState("20");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [{ data: req }, { data: q }, { data: s }] = await Promise.all([
      supabase.from("parts_requests").select("*").eq("id", requestId).single(),
      supabase.from("supplier_quotes").select("*, suppliers(name, whatsapp_number)").eq("request_id", requestId).order("created_at", { ascending: false }),
      supabase.from("suppliers").select("*").eq("active", true).order("name"),
    ]);
    if (req) setRequest(req);
    if (q) setQuotes(q);
    if (s) setSuppliers(s);
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
    if (!supplierId || !price) { alert("Select a supplier and enter the price"); return; }
    setUploadingQuote(true);
    try {
      let imageUrl = null;
      try { if (quoteImage) imageUrl = await uploadImage(quoteImage, "quote-requests"); } catch (e) { console.error(e); }
      const numericPrice = Number(price);
      const sellPrice = (numericPrice * (1 + Number(markup) / 100)).toFixed(2);
      const { error } = await supabase.from("supplier_quotes").insert([{
        request_id: requestId, supplier_id: supplierId,
        supplier_price: numericPrice, marked_up_price: sellPrice,
        notes: note, quote_image_url: imageUrl,
      }]);
      if (error) { alert("Failed to save quote"); return; }
      await supabase.from("parts_requests").update({ status: "Quoted" }).eq("id", requestId);
      setPrice(""); setSupplierId(""); setNote(""); setQuoteImage(null);
      fetchData();
    } catch (err: any) { alert("Error: " + err.message); }
    setUploadingQuote(false);
  }

  async function saveSupplierConfirmation() {
    setUploadingConfirm(true);
    try {
      let imageUrl = null;
      if (confirmImage) imageUrl = await uploadImage(confirmImage, "supplier-confirmations");
      await supabase.from("supplier_quotes").update({
        supplier_confirmation_image: imageUrl,
        supplier_confirmation_note: confirmNote,
        supplier_confirmed: true,
      }).eq("id", confirmModal.id);
      setConfirmModal(null); setConfirmImage(null); setConfirmNote("");
      fetchData();
    } catch { alert("Failed to save confirmation"); }
    setUploadingConfirm(false);
  }

  async function saveEdit() {
    if (!editPrice) return;
    setSavingEdit(true);
    const numericPrice = Number(editPrice);
    const sellPrice = (numericPrice * (1 + Number(editMarkup) / 100)).toFixed(2);
    await supabase.from("supplier_quotes").update({
      supplier_price: numericPrice,
      marked_up_price: sellPrice,
    }).eq("id", editingQuote.id);
    setEditingQuote(null);
    fetchData();
    setSavingEdit(false);
  }

    async function deleteQuote(id: number) {
    if (!confirm("Delete this quote?")) return;
    await supabase.from("supplier_quotes").delete().eq("id", id);
    fetchData();
  }

  async function convertToSale(quote: any) {
    if (!confirm("Convert this quote to a sale?")) return;
    const { error } = await supabase.from("sales").insert([{
      request_id: request.id, supplier_quote_id: quote.id,
      customer_name: request.customer_name, customer_phone: request.phone_number,
      supplier_price: quote.supplier_price, selling_price: quote.marked_up_price,
      profit: Number(quote.marked_up_price) - Number(quote.supplier_price), status: "Completed",
    }]);
    if (error) { alert("Failed to create sale"); return; }
    await supabase.from("parts_requests").update({ status: "Ordered" }).eq("id", request.id);
    router.push("/sales");
  }

  function sendCustomerWhatsApp(quote: any) {
    const msg = `Hi ${request.customer_name},\n\nWe found your part!\n\nVehicle: ${request.vehicle_make} ${request.vehicle_model} ${request.vehicle_year}\nPart: ${request.part_needed}\nPrice: R${quote.marked_up_price}\n\nReply YES to confirm.\n\nCape Parts Finder`;
    window.open(`https://wa.me/${request.phone_number.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`);
  }

  function sendConfirmationWhatsApp(quote: any) {
    const imageUrl = quote.supplier_confirmation_image || quote.quote_image_url;
    const msg = `Hi ${request.customer_name},\n\nPart confirmation:\n\nVehicle: ${request.vehicle_make} ${request.vehicle_model}\nPart: ${request.part_needed}\nPrice: R${quote.marked_up_price}\n\nImage: ${imageUrl}\n\nReply to confirm.\n\nCape Parts Finder`;
    window.open(`https://wa.me/${request.phone_number.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`);
  }

  const supplierPrice = Number(price) || 0;
  const markupAmt = supplierPrice * Number(markup) / 100;
  const customerPrice = supplierPrice + markupAmt;

  const darkBg = { background: "#111111", minHeight: "100vh" };
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" };

  if (!request) {
    return (
      <main style={darkBg} className="flex items-center justify-center">
        <div className="flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 32px" }}>
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <p className="text-gray-300 text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={darkBg}>
      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* NAV */}
        <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", background: "rgba(17,17,17,0.85)", position: "sticky", top: 0, zIndex: 50 }}>
          <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center" style={{ boxShadow: "0 0 16px rgba(249,115,22,0.35)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <span className="font-bold text-white text-[14px]">Cape Parts Finder</span>
            </div>
            <div className="flex gap-1">
              {[{ label: "Requests", href: "/admin" }, { label: "Suppliers", href: "/suppliers" }, { label: "Sales", href: "/sales" }].map((n) => (
                <a key={n.href} href={n.href} className="px-3.5 py-1.5 rounded-lg text-[13px] no-underline font-medium transition"
                  style={{ color: "rgba(255,255,255,0.4)", border: "1px solid transparent" }}>{n.label}</a>
              ))}
            </div>
            <button onClick={() => router.push("/admin")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-5 py-6">

          {/* REQUEST SUMMARY */}
          <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-orange-400 font-bold text-[15px]"
                  style={{ background: "rgba(249,115,22,0.12)" }}>
                  {(request.customer_name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h1 className="font-bold text-[17px] text-white">{request.customer_name}</h1>
                  <p className="text-[12px] text-gray-500 mt-0.5">{request.vehicle_year} {request.vehicle_make} {request.vehicle_model} · <span className="text-orange-400">{request.part_needed}</span></p>
                </div>
              </div>
              <button onClick={() => window.open("https://wa.me/" + request.phone_number?.replace(/\D/g, ""))}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                WhatsApp Customer
              </button>
            </div>
            {request.photo_url && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Customer Photo</p>
                <img src={request.photo_url} alt="Customer upload" className="w-40 rounded-xl cursor-pointer"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }} onClick={() => window.open(request.photo_url)} />
              </div>
            )}
          </div>

          {/* ── FAST QUOTE ENTRY ── */}
          <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
            <h2 className="font-bold text-[15px] text-white mb-4">Add Quote</h2>

            {/* Supplier + Price + Markup in one row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                className="rounded-xl px-3 py-3 text-[13px] outline-none cursor-pointer text-white col-span-2 lg:col-span-1"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <option value="" style={{ background: "#1a1a1a" }}>Select Supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id} style={{ background: "#1a1a1a" }}>{s.name}</option>)}
              </select>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[13px]">R</span>
                <input type="number" placeholder="Supplier Price" value={price} onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl pl-7 pr-3 py-3 text-[13px] outline-none text-white placeholder-gray-600"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {["10","15","20","25","30"].map(m => (
                    <button key={m} type="button" onClick={() => setMarkup(m)}
                      className="px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition"
                      style={markup === m
                        ? { background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.4)", color: "#fb923c" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                      {m}%
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input type="number" value={markup} onChange={(e) => setMarkup(e.target.value)} min="0" max="200"
                    className="w-full rounded-xl px-3 py-2 text-[13px] outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-[12px]">%</span>
                </div>
              </div>
              <input type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
                className="rounded-xl px-3 py-3 text-[13px] outline-none text-white placeholder-gray-600"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>

            {/* Live price preview */}
            {supplierPrice > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Supplier Cost</p>
                  <p className="text-[24px] font-black text-white">R{supplierPrice.toFixed(2)}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(249,115,22,0.6)" }}>Your Markup</p>
                  <p className="text-[24px] font-black" style={{ color: "#fb923c" }}>R{markupAmt.toFixed(2)}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(34,197,94,0.7)" }}>Customer Price</p>
                  <p className="text-[24px] font-black" style={{ color: "#4ade80" }}>R{customerPrice.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Optional image */}
            <div className="flex items-center gap-3">
              <div onClick={() => document.getElementById("quote-img")?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition text-[12px]"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                {quoteImage ? quoteImage.name : "Attach image (optional)"}
              </div>
              <input id="quote-img" type="file" accept="image/*" className="hidden" onChange={(e) => setQuoteImage(e.target.files?.[0] || null)} />
              <button onClick={saveQuote} disabled={uploadingQuote || !supplierId || !price}
                className="px-6 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition text-white ml-auto"
                style={{ background: !supplierId || !price ? "rgba(249,115,22,0.3)" : "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: !supplierId || !price ? "none" : "0 4px 16px rgba(249,115,22,0.25)" }}>
                {uploadingQuote ? "Saving..." : "Save Quote →"}
              </button>
            </div>
          </div>

          {/* QUOTES LIST */}
          <div className="space-y-3">
            {quotes.length === 0 && (
              <div className="rounded-xl p-10 text-center" style={cardStyle}>
                <p className="text-gray-600 text-sm">No quotes yet — add one above</p>
              </div>
            )}

            {quotes.map((quote) => (
              <div key={quote.id} className="rounded-2xl overflow-hidden" style={cardStyle}>

                {/* Quote header */}
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <h2 className="font-bold text-[14px] text-white">{quote.suppliers?.name}</h2>
                    <p className="text-[11px] text-gray-600 mt-0.5">{new Date(quote.created_at).toLocaleString("en-ZA")}</p>
                  </div>
                  {quote.supplier_confirmed && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>
                      <span className="w-1 h-1 rounded-full bg-green-400" /> Confirmed
                    </span>
                  )}
                </div>

                <div className="px-5 py-4">
                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Supplier Cost</p>
                      <p className="text-[22px] font-black text-white">R{quote.supplier_price}</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(34,197,94,0.6)" }}>Customer Price</p>
                      <p className="text-[22px] font-black" style={{ color: "#4ade80" }}>R{quote.marked_up_price}</p>
                    </div>
                  </div>

                  {/* Images */}
                  {(quote.quote_image_url || quote.supplier_confirmation_image || request.photo_url) && (
                    <div className="flex gap-3 mb-4 flex-wrap">
                      {request.photo_url && (
                        <div className="rounded-lg overflow-hidden cursor-pointer" style={{ border: "1px solid rgba(255,255,255,0.08)" }} onClick={() => window.open(request.photo_url)}>
                          <p className="text-[9px] font-bold uppercase px-2 py-1" style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.03)" }}>Customer Photo</p>
                          <img src={request.photo_url} alt="Customer" className="w-24 h-20 object-cover" />
                        </div>
                      )}
                      {quote.quote_image_url && (
                        <div className="rounded-lg overflow-hidden cursor-pointer" style={{ border: "1px solid rgba(255,255,255,0.08)" }} onClick={() => window.open(quote.quote_image_url)}>
                          <p className="text-[9px] font-bold uppercase px-2 py-1" style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.03)" }}>Sent to Supplier</p>
                          <img src={quote.quote_image_url} alt="Quote" className="w-24 h-20 object-cover" />
                        </div>
                      )}
                      {quote.supplier_confirmation_image && (
                        <div className="rounded-lg overflow-hidden cursor-pointer" style={{ border: "1px solid rgba(34,197,94,0.2)" }} onClick={() => window.open(quote.supplier_confirmation_image)}>
                          <p className="text-[9px] font-bold uppercase px-2 py-1" style={{ color: "rgba(34,197,94,0.6)", background: "rgba(34,197,94,0.06)" }}>Supplier Confirmed</p>
                          <img src={quote.supplier_confirmation_image} alt="Confirmation" className="w-24 h-20 object-cover" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => sendCustomerWhatsApp(quote)}
                      className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition text-white"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      Send Quote to Customer
                    </button>
                    {quote.supplier_confirmation_image && (
                      <button onClick={() => sendConfirmationWhatsApp(quote)}
                        className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                        style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366" }}>
                        Send Confirmation to Customer
                      </button>
                    )}
                    {!quote.supplier_confirmed && (
                      <button onClick={() => { setConfirmModal(quote); setConfirmImage(null); setConfirmNote(""); }}
                        className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                        style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                        Upload Supplier Confirmation
                      </button>
                    )}
                    <button onClick={() => window.open("https://wa.me/" + quote.suppliers?.whatsapp_number?.replace(/\D/g, ""))}
                      className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                      style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.15)", color: "#25D366" }}>
                      WhatsApp Supplier
                    </button>
                    <button onClick={() => convertToSale(quote)}
                      className="px-3 py-2 rounded-lg text-[12px] font-bold cursor-pointer transition text-white"
                      style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 12px rgba(249,115,22,0.2)" }}>
                      Convert to Sale
                    </button>
                    <button onClick={() => { setEditingQuote(quote); setEditPrice(String(quote.supplier_price)); setEditMarkup(String(Math.round((Number(quote.marked_up_price) / Number(quote.supplier_price) - 1) * 100))); }}
                      className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                      style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)", color: "#fb923c" }}>
                      Edit Price
                    </button>
                    <button onClick={() => deleteQuote(quote.id)}
                      className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition ml-auto"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUPPLIER CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h2 className="font-bold text-[15px] text-white">Upload Confirmation</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">From: {confirmModal.suppliers?.name}</p>
              </div>
              <button onClick={() => setConfirmModal(null)} className="text-gray-500 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div onClick={() => document.getElementById("confirm-img")?.click()}
                className="rounded-xl p-5 text-center cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                {confirmImage ? (
                  <div>
                    <img src={URL.createObjectURL(confirmImage)} alt="Preview" className="w-full max-h-40 object-contain rounded-lg mb-2" />
                    <p className="text-[11px] text-gray-500">{confirmImage.name}</p>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <svg className="mx-auto mb-2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <p className="text-[13px]">Click to upload confirmation image</p>
                  </div>
                )}
              </div>
              <input id="confirm-img" type="file" accept="image/*" className="hidden" onChange={(e) => setConfirmImage(e.target.files?.[0] || null)} />
              <textarea value={confirmNote} onChange={(e) => setConfirmNote(e.target.value)}
                placeholder="Note from supplier (optional)..." rows={2}
                className="w-full rounded-xl px-4 py-3 text-[13px] outline-none resize-none text-white placeholder-gray-600"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <div className="flex gap-2">
                <button onClick={saveSupplierConfirmation} disabled={uploadingConfirm}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition text-white"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 16px rgba(249,115,22,0.25)" }}>
                  {uploadingConfirm ? "Saving..." : "Save Confirmation"}
                </button>
                <button onClick={() => setConfirmModal(null)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {editingQuote && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Edit Quote Price</h2>
              <button onClick={() => setEditingQuote(null)} className="text-gray-500 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Supplier Price</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[13px]">R</span>
                  <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                    className="w-full rounded-xl pl-7 pr-3 py-3 text-[14px] outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Markup %</p>
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {["10","15","20","25","30"].map(m => (
                    <button key={m} type="button" onClick={() => setEditMarkup(m)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition"
                      style={editMarkup === m ? { background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.4)", color: "#fb923c" } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                      {m}%
                    </button>
                  ))}
                </div>
                <input type="number" value={editMarkup} onChange={e => setEditMarkup(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              {editPrice && (
                <div className="rounded-xl p-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(34,197,94,0.6)" }}>New Customer Price</p>
                  <p className="text-[24px] font-black" style={{ color: "#4ade80" }}>R{(Number(editPrice) * (1 + Number(editMarkup) / 100)).toFixed(2)}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition text-white"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 16px rgba(249,115,22,0.25)" }}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => setEditingQuote(null)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
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
