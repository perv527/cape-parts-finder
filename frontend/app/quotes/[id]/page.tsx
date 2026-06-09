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
  const [sales, setSales] = useState<any[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [price, setPrice] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [quoteImage, setQuoteImage] = useState<File | null>(null);
  const [uploadingQuote, setUploadingQuote] = useState(false);
  const [markup, setMarkup] = useState("20");

  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
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

  async function getAiSuggestion() {
    if (!price || parseFloat(price) <= 0) {
      alert("Enter the supplier price first");
      return;
    }
    setLoadingAi(true);
    setAiSuggestion(null);
    try {
      const vehicle = `${request?.vehicle_year || ""} ${request?.vehicle_make || ""} ${request?.vehicle_model || ""}`.trim();
      const res = await fetch("/api/suggest-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partName: request?.part_needed || "part",
          vehicle,
          supplierPrice: parseFloat(price),
          pastSales: sales.slice(0, 10),
        }),
      });
      const data = await res.json();
      if (data.markup) {
        setAiSuggestion(data);
        setMarkup(String(data.markup));
      }
    } catch (err) {
      alert("AI suggestion failed. Please try again.");
    }
    setLoadingAi(false);
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


  async function printInvoice(quote: any) {
    const invNum = `INV-${String(request.id).padStart(4,"0")}-${String(quote.id).padStart(4,"0")}`;
    const date = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
    const base = Number(quote.marked_up_price);
    const vat = base * 0.15;
    const total = base + vat;
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Invoice ${invNum} — Cape Parts Finder</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter','Helvetica Neue',Arial,sans-serif;background:#fff;color:#1a1a1a;font-size:11.5px;line-height:1.45;}
.page{max-width:720px;margin:0 auto;padding:36px 44px;}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;}
.logo-wrap{display:flex;align-items:center;gap:11px;}
.logo-box{width:38px;height:38px;background:#f97316;border-radius:9px;display:flex;align-items:center;justify-content:center;}
.logo-box svg{width:19px;height:19px;}
.brand-name{font-size:16px;font-weight:800;color:#0a0a0a;}
.brand-sub{font-size:9.5px;color:#aaa;margin-top:2px;}
.inv-info{text-align:right;}
.inv-tag{font-size:7.5px;font-weight:800;text-transform:uppercase;letter-spacing:2.5px;color:#ccc;margin-bottom:3px;}
.inv-num{font-size:17px;font-weight:900;color:#0a0a0a;}
.inv-badge{display:inline-block;margin-top:6px;background:#14b8a6;color:white;font-size:9px;font-weight:800;padding:3px 10px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;}
.inv-meta{font-size:9.5px;color:#aaa;margin-top:4px;line-height:1.7;}
.accent-line{height:1.5px;background:linear-gradient(90deg,#f97316 0%,#fdba74 50%,#fff 100%);margin-bottom:20px;}
.sec{font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:2.5px;color:#ccc;margin-bottom:8px;}
.panels{display:grid;grid-template-columns:1fr 1fr;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;margin-bottom:20px;}
.panel{padding:13px 18px;}
.panel:first-child{border-right:1px solid #e8e8e8;}
.panel-row{display:flex;justify-content:space-between;align-items:baseline;padding:3.5px 0;}
.panel-row+.panel-row{border-top:1px solid #f3f3f3;}
.pl{font-size:9.5px;color:#bbb;font-weight:500;}
.pv{font-size:10.5px;font-weight:600;color:#1a1a1a;text-align:right;}
.part-block{padding:14px 0;border-top:1px solid #e8e8e8;border-bottom:1px solid #e8e8e8;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start;gap:14px;}
.part-name{font-size:19px;font-weight:900;color:#0a0a0a;text-transform:capitalize;}
.part-sub{font-size:10px;color:#aaa;margin-top:3px;}
.pref-badge{flex-shrink:0;border:1px solid #14b8a6;border-radius:20px;padding:2px 10px;font-size:9.5px;font-weight:700;color:#14b8a6;}
.paid-stamp{text-align:center;padding:16px;margin-bottom:20px;border-radius:10px;background:rgba(20,184,166,0.06);border:2px solid rgba(20,184,166,0.3);}
.paid-text{font-size:32px;font-weight:900;color:#14b8a6;letter-spacing:4px;opacity:0.8;}
.paid-sub{font-size:10px;color:#aaa;margin-top:4px;}
.pricing-wrap{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:18px;align-items:start;}
.price-table{width:100%;border-collapse:collapse;}
.price-table td{padding:5.5px 0;font-size:11px;vertical-align:baseline;}
.price-table tr+tr td{border-top:1px solid #f0f0f0;}
.pt-label{color:#888;width:60%;}
.pt-value{text-align:right;font-weight:600;color:#333;}
.price-total td{border-top:1.5px solid #1a1a1a!important;padding-top:8px;}
.pt-total-label{font-size:12px;font-weight:800;color:#0a0a0a;}
.pt-total-value{font-size:21px;font-weight:900;color:#14b8a6;text-align:right;}
.bank-table{width:100%;border-collapse:collapse;}
.bank-table td{padding:5px 0;font-size:10px;vertical-align:baseline;}
.bank-table tr+tr td{border-top:1px solid #f0f0f0;}
.bl{color:#bbb;font-weight:500;width:45%;}
.bv{text-align:right;font-weight:700;color:#1a1a1a;}
.bv.accent{color:#14b8a6;font-size:11px;}
.disclaimer{border:1px solid #efefef;border-radius:7px;padding:11px 15px;margin-bottom:18px;}
.disclaimer p{font-size:8.5px;color:#999;line-height:1.7;}
.footer{display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid #e8e8e8;}
.footer-left .fb{font-size:11px;font-weight:800;color:#0a0a0a;}
.footer-left .ft{font-size:8.5px;color:#ccc;margin-top:2px;}
.footer-right{text-align:right;}
.footer-right div{font-size:8.5px;color:#aaa;line-height:1.85;}
.footer-right .fo{color:#14b8a6;font-weight:700;font-size:10px;}
@media print{@page{size:A4;margin:10mm;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page{padding:20px 30px;}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo-wrap">
      <div class="logo-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      </div>
      <div>
        <div class="brand-name">Cape Parts Finder</div>
        <div class="brand-sub">Your Trusted Auto Parts Network · Cape Town</div>
      </div>
    </div>
    <div class="inv-info">
      <div class="inv-tag">Tax Invoice</div>
      <div class="inv-num">${invNum}</div>
      <div class="inv-badge">✓ PAID</div>
      <div class="inv-meta">Date: ${date}</div>
    </div>
  </div>
  <div class="accent-line"></div>
  <div class="panels">
    <div class="panel">
      <div class="sec">Invoiced To</div>
      <div class="panel-row"><span class="pl">Full Name</span><span class="pv">${request.customer_name || "—"}</span></div>
      <div class="panel-row"><span class="pl">Phone</span><span class="pv">${request.phone_number || "—"}</span></div>
      ${request.email ? `<div class="panel-row"><span class="pl">Email</span><span class="pv">${request.email}</span></div>` : ""}
      ${request.area ? `<div class="panel-row"><span class="pl">Area</span><span class="pv">${request.area}</span></div>` : ""}
    </div>
    <div class="panel">
      <div class="sec">Vehicle Details</div>
      <div class="panel-row"><span class="pl">Make</span><span class="pv">${request.vehicle_make || "—"}</span></div>
      <div class="panel-row"><span class="pl">Model</span><span class="pv">${request.vehicle_model || "—"}</span></div>
      <div class="panel-row"><span class="pl">Year</span><span class="pv">${request.vehicle_year || "—"}</span></div>
      ${request.vin_number ? `<div class="panel-row"><span class="pl">VIN</span><span class="pv">${request.vin_number}</span></div>` : ""}
    </div>
  </div>
  <div class="sec">Part Supplied</div>
  <div class="part-block">
    <div>
      <div class="part-name">${request.part_needed || "—"}</div>
      <div class="part-sub">${request.vehicle_year || ""} ${request.vehicle_make || ""} ${request.vehicle_model || ""}${request.engine_size ? " · " + request.engine_size : ""}</div>
    </div>
    ${request.part_preference ? `<div class="pref-badge">${request.part_preference}</div>` : ""}
  </div>
  <div class="paid-stamp">
    <div class="paid-text">PAID</div>
    <div class="paid-sub">Thank you for your payment · Cape Parts Finder</div>
  </div>
  <div class="pricing-wrap">
    <div>
      <div class="sec">Invoice Summary</div>
      <table class="price-table">
        <tr><td class="pt-label">Part &amp; Sourcing Fee</td><td class="pt-value">R${base.toFixed(2)}</td></tr>
        <tr><td class="pt-label">VAT (15%)</td><td class="pt-value">R${vat.toFixed(2)}</td></tr>
        <tr class="price-total"><td class="pt-total-label">Total Paid</td><td class="pt-total-value">R${total.toFixed(2)}</td></tr>
      </table>
      <div style="font-size:8.5px;color:#bbb;margin-top:5px;">All amounts in South African Rand (ZAR)</div>
    </div>
    <div>
      <div class="sec">Payment Details</div>
      <table class="bank-table">
        <tr><td class="bl">Bank</td><td class="bv">First National Bank (FNB)</td></tr>
        <tr><td class="bl">Account Name</td><td class="bv">Cape Parts Finder</td></tr>
        <tr><td class="bl">Account Number</td><td class="bv accent">62863344596</td></tr>
        <tr><td class="bl">Account Type</td><td class="bv">Savings Account</td></tr>
        <tr><td class="bl">Reference</td><td class="bv">${invNum}</td></tr>
      </table>
    </div>
  </div>
  <div class="disclaimer">
    <p>This is an official tax invoice issued by Cape Parts Finder. Parts supplied are subject to supplier warranty only. Cape Parts Finder acts as intermediary and accepts no liability for fitment or compatibility issues. This invoice confirms payment received in full.</p>
  </div>
  <div class="footer">
    <div class="footer-left">
      <div class="fb">Cape Parts Finder</div>
      <div class="ft">Connecting you with quality parts across Cape Town</div>
    </div>
    <div class="footer-right">
      <div class="fo">+27 69 686 3952</div>
      <div>cape-parts-finder.vercel.app</div>
      <div>Cape Town, South Africa</div>
    </div>
  </div>
</div>
</body>
</html>`;
    const win = window.open("", "_blank");
    if (!win) { alert("Allow popups to print"); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  }

  async function rejectQuote() {
    if (!rejectModal) return;
    setRejecting(true);
    await supabase.from("supplier_quotes").update({
      notes: (rejectModal.notes ? rejectModal.notes + " | " : "") + "REJECTED: " + (rejectReason || "No reason given"),
      rejected: true,
    }).eq("id", rejectModal.id);
    setRejecting(false);
    setRejectModal(null);
    setRejectReason("");
    fetchData();
  }

  async function getNextNumber(type: "invoice" | "quote") {
    const { data } = await supabase.from("invoice_counter").select("*").eq("id", 1).single();
    const current = data || { last_invoice_number: 0, last_quote_number: 0 };
    if (type === "invoice") {
      const next = (current.last_invoice_number || 0) + 1;
      await supabase.from("invoice_counter").update({ last_invoice_number: next, updated_at: new Date().toISOString() }).eq("id", 1);
      return "INV-" + String(next).padStart(4, "0");
    } else {
      const next = (current.last_quote_number || 0) + 1;
      await supabase.from("invoice_counter").update({ last_quote_number: next, updated_at: new Date().toISOString() }).eq("id", 1);
      return "QUO-" + String(next).padStart(4, "0");
    }
  }

  async function printQuote(quote: any) {
      const quoteNum = await getNextNumber("quote");
    const date = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
    const expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
    const basePrice = Number(quote.marked_up_price);
    const vatAmt = basePrice * 0.15;
    const totalVat = basePrice + vatAmt;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Quote ${quoteNum} — Cape Parts Finder</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; color: #1a1a1a; font-size: 11.5px; line-height: 1.45; }
    .page { max-width: 720px; margin: 0 auto; padding: 36px 44px; }

    /* ── HEADER ── */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
    .logo-wrap { display: flex; align-items: center; gap: 13px; }
    .logo-box { width: 42px; height: 42px; background: #f97316; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-box svg { width: 21px; height: 21px; }
    .brand-name { font-size: 18px; font-weight: 800; color: #0a0a0a; letter-spacing: -0.4px; }
    .brand-sub { font-size: 10.5px; color: #aaa; margin-top: 2px; font-weight: 400; }
    .quote-info { text-align: right; }
    .quote-tag { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.5px; color: #ccc; margin-bottom: 4px; }
    .quote-num { font-size: 19px; font-weight: 900; color: #0a0a0a; letter-spacing: -0.5px; }
    .quote-meta { font-size: 10px; color: #aaa; margin-top: 5px; line-height: 1.8; }

    /* ── ACCENT LINE ── */
    .accent-line { height: 1.5px; background: linear-gradient(90deg, #f97316 0%, #fdba74 50%, #fff 100%); margin-bottom: 20px; }

    /* ── SECTION HEADING ── */
    .sec { font-size: 7.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; color: #ccc; margin-bottom: 10px; }

    /* ── INFO PANELS ── */
    .panels { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #e8e8e8; border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
    .panel { padding: 13px 18px; }
    .panel:first-child { border-right: 1px solid #e8e8e8; }
    .panel-row { display: flex; justify-content: space-between; align-items: baseline; padding: 5px 0; }
    .panel-row + .panel-row { border-top: 1px solid #f3f3f3; }
    .pl { font-size: 10px; color: #bbb; font-weight: 500; }
    .pv { font-size: 11px; font-weight: 600; color: #1a1a1a; text-align: right; max-width: 60%; }

    /* ── PART BLOCK ── */
    .part-block { padding: 14px 0; border-top: 1px solid #e8e8e8; border-bottom: 1px solid #e8e8e8; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .part-name { font-size: 19px; font-weight: 900; color: #0a0a0a; letter-spacing: -0.5px; text-transform: capitalize; }
    .part-sub { font-size: 11px; color: #aaa; margin-top: 4px; }
    .part-extra { font-size: 10.5px; color: #777; margin-top: 6px; font-style: italic; }
    .pref-badge { flex-shrink: 0; margin-top: 4px; border: 1px solid #f97316; border-radius: 20px; padding: 3px 11px; font-size: 10px; font-weight: 700; color: #f97316; white-space: nowrap; letter-spacing: 0.3px; }

    /* ── PRICING ── */
    .pricing-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 18px; align-items: start; }
    .price-table { width: 100%; border-collapse: collapse; }
    .price-table td { padding: 7px 0; font-size: 11.5px; vertical-align: baseline; }
    .price-table tr + tr td { border-top: 1px solid #f0f0f0; }
    .pt-label { color: #888; width: 60%; }
    .pt-value { text-align: right; font-weight: 600; color: #333; }
    .price-total td { border-top: 1.5px solid #1a1a1a !important; padding-top: 10px; }
    .pt-total-label { font-size: 13px; font-weight: 800; color: #0a0a0a; }
    .pt-total-value { font-size: 21px; font-weight: 900; color: #f97316; text-align: right; letter-spacing: -0.5px; }
    .vat-note { font-size: 9.5px; color: #bbb; margin-top: 6px; line-height: 1.5; }

    /* ── BANKING ── */
    .bank-table { width: 100%; border-collapse: collapse; }
    .bank-table td { padding: 6px 0; font-size: 10.5px; vertical-align: baseline; }
    .bank-table tr + tr td { border-top: 1px solid #f0f0f0; }
    .bl { color: #bbb; font-weight: 500; width: 45%; }
    .bv { text-align: right; font-weight: 700; color: #1a1a1a; }
    .bv.accent { color: #f97316; font-size: 12px; }
    .bank-note { font-size: 9.5px; color: #aaa; margin-top: 8px; line-height: 1.6; }

    /* ── TERMS ROW ── */
    .terms { display: flex; gap: 0; border-top: 1px solid #e8e8e8; border-bottom: 1px solid #e8e8e8; margin-bottom: 28px; }
    .term { flex: 1; padding: 13px 16px; display: flex; align-items: center; gap: 9px; }
    .term + .term { border-left: 1px solid #e8e8e8; }
    .tdot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .ttext { font-size: 10.5px; color: #555; line-height: 1.4; }
    .ttext strong { color: #1a1a1a; font-weight: 700; }

    /* ── NOTES ── */
    .note-box { border-left: 2px solid #f97316; padding: 9px 14px; margin-bottom: 28px; font-size: 10.5px; color: #666; line-height: 1.65; }

    /* ── DISCLAIMER ── */
    .disclaimer { background: #fafafa; border: 1px solid #efefef; border-radius: 8px; padding: 14px 18px; margin-bottom: 18px; }
    .disclaimer p { font-size: 9.5px; color: #888; line-height: 1.75; margin-bottom: 5px; }
    .disclaimer p:last-child { margin-bottom: 0; }
    .disclaimer strong { color: #666; font-weight: 600; }

    /* ── FOOTER ── */
    .footer { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid #e8e8e8; }
    .footer-left .fb { font-size: 12px; font-weight: 800; color: #0a0a0a; }
    .footer-left .ft { font-size: 9.5px; color: #ccc; margin-top: 2px; }
    .footer-right { text-align: right; }
    .footer-right div { font-size: 9.5px; color: #aaa; line-height: 1.85; }
    .footer-right .fo { color: #f97316; font-weight: 700; font-size: 10.5px; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 28px 36px; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="logo-wrap">
      <div class="logo-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <div>
        <div class="brand-name">Cape Parts Finder</div>
        <div class="brand-sub">Your Trusted Auto Parts Network &middot; Cape Town</div>
      </div>
    </div>
    <div class="quote-info">
      <div class="quote-tag">Quotation</div>
      <div class="quote-num">${quoteNum}</div>
      <div class="quote-meta">
        Issued: ${date}<br/>
        Valid until: <strong style="color:#f97316;">${expiryDate}</strong>
      </div>
    </div>
  </div>

  <div class="accent-line"></div>

  <!-- CUSTOMER + VEHICLE -->
  <div class="panels">
    <div class="panel">
      <div class="sec">Prepared For</div>
      <div class="panel-row"><span class="pl">Full Name</span><span class="pv">${request.customer_name || "—"}</span></div>
      <div class="panel-row"><span class="pl">Phone</span><span class="pv">${request.phone_number || "—"}</span></div>
      ${request.email ? `<div class="panel-row"><span class="pl">Email</span><span class="pv">${request.email}</span></div>` : ""}
      ${request.area ? `<div class="panel-row"><span class="pl">Area</span><span class="pv">${request.area}</span></div>` : ""}
    </div>
    <div class="panel">
      <div class="sec">Vehicle Details</div>
      <div class="panel-row"><span class="pl">Make</span><span class="pv">${request.vehicle_make || "—"}</span></div>
      <div class="panel-row"><span class="pl">Model</span><span class="pv">${request.vehicle_model || "—"}</span></div>
      <div class="panel-row"><span class="pl">Year</span><span class="pv">${request.vehicle_year || "—"}</span></div>
      ${request.vin_number ? `<div class="panel-row"><span class="pl">VIN</span><span class="pv">${request.vin_number}</span></div>` : ""}
      ${request.engine_size ? `<div class="panel-row"><span class="pl">Engine</span><span class="pv">${request.engine_size}</span></div>` : ""}
    </div>
  </div>

  <!-- PART -->
  <div class="sec">Part Description</div>
  <div class="part-block">
    <div>
      <div class="part-name">${request.part_needed || "—"}</div>
      <div class="part-sub">${request.vehicle_year || ""} ${request.vehicle_make || ""} ${request.vehicle_model || ""}${request.engine_size ? " &middot; " + request.engine_size : ""}</div>
      ${request.extra_details ? `<div class="part-extra">${request.extra_details}</div>` : ""}
    </div>
    ${request.part_preference ? `<div class="pref-badge">${request.part_preference}</div>` : ""}
  </div>

  <!-- PRICING + BANKING side by side -->
  <div class="pricing-wrap">

    <div>
      <div class="sec">Pricing Summary</div>
      <table class="price-table">
        <tr>
          <td class="pt-label">Part &amp; Sourcing Fee</td>
          <td class="pt-value">R${basePrice.toFixed(2)}</td>
        </tr>
        <tr>
          <td class="pt-label">VAT (15%)</td>
          <td class="pt-value">R${vatAmt.toFixed(2)}</td>
        </tr>
        <tr class="price-total">
          <td class="pt-total-label">Total Amount Due</td>
          <td class="pt-total-value">R${totalVat.toFixed(2)}</td>
        </tr>
      </table>
      <div class="vat-note">All amounts in South African Rand (ZAR)<br/>VAT Reg No: —</div>
    </div>

    <div>
      <div class="sec">Payment Details</div>
      <table class="bank-table">
        <tr>
          <td class="bl">Bank</td>
          <td class="bv">First National Bank (FNB)</td>
        </tr>
        <tr>
          <td class="bl">Account Name</td>
          <td class="bv">Cape Parts Finder</td>
        </tr>
        <tr>
          <td class="bl">Account Number</td>
          <td class="bv accent">62863344596</td>
        </tr>
        <tr>
          <td class="bl">Account Type</td>
          <td class="bv">Savings Account</td>
        </tr>
        <tr>
          <td class="bl">Reference</td>
          <td class="bv">${quoteNum}</td>
        </tr>
      </table>
      <div class="bank-note">Use your quote number as payment reference.<br/>Send proof of payment via WhatsApp to confirm.</div>
    </div>

  </div>

  ${quote.notes ? `<div class="note-box">${quote.notes}</div>` : ""}

  <!-- DISCLAIMER -->
  <div class="disclaimer">
    <div class="sec" style="margin-bottom:8px;">Terms &amp; Disclaimer</div>
    <p>All parts sourced are subject to the <strong>manufacturer's or supplier's warranty</strong> only. Cape Parts Finder acts solely as an intermediary between the customer and supplier. The applicable guarantee and warranty terms are as provided by the supplying party and Cape Parts Finder accepts no responsibility beyond that warranty.</p>
    <p>Cape Parts Finder accepts no liability for parts incompatibility, fitment issues, or any damage arising from incorrect installation. It is the customer's sole responsibility to verify part compatibility with their vehicle prior to fitment.</p>
    <p>This quotation is valid for <strong>3 days</strong> from the date of issue and is subject to stock availability at time of order confirmation. This document does not constitute a binding agreement until full payment has been received and confirmed by Cape Parts Finder.</p>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-left">
      <div class="fb">Cape Parts Finder</div>
      <div class="ft">Connecting you with quality parts across Cape Town</div>
    </div>
    <div class="footer-right">
      <div class="fo">+27 69 686 3952</div>
      <div>cape-parts-finder.vercel.app</div>
      <div>Cape Town, South Africa</div>
    </div>
  </div>

</div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { alert("Allow popups to print the quote"); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
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
              {[{ label: "Requests", href: "/admin" }, { label: "Suppliers", href: "/suppliers" }, { label: "Sales", href: "/sales" }, { label: "Analytics", href: "/analytics" }].map((n) => (
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

          {/* FAST QUOTE ENTRY */}
          <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
            <h2 className="font-bold text-[15px] text-white mb-4">Add Quote</h2>
            <div className="flex flex-col gap-3 mb-4">
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-[13px] outline-none cursor-pointer text-white className_fix"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <option value="" style={{ background: "#1a1a1a" }}>Select Supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id} style={{ background: "#1a1a1a" }}>{s.name}</option>)}
              </select>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[15px]">R</span>
                <input type="text" inputMode="decimal" placeholder="e.g. 350.00" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g,""))}
                  className="w-full rounded-xl pl-8 pr-3 py-4 text-[16px] font-semibold outline-none text-white placeholder-gray-600"
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
                  <input type="text" inputMode="decimal" value={markup} onChange={(e) => setMarkup(e.target.value.replace(/[^0-9.]/g,""))}
                    className="w-full rounded-xl px-3 py-3 text-[14px] outline-none text-white font-semibold"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-[12px]">%</span>
                </div>
              </div>
              <input type="text" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
                className="rounded-xl px-3 py-3 text-[13px] outline-none text-white placeholder-gray-600"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>

            {supplierPrice > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Supplier Cost</p>
                  <p className="text-[18px] font-black text-white">R{supplierPrice.toFixed(2)}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(249,115,22,0.6)" }}>Your Markup</p>
                  <p className="text-[18px] font-black" style={{ color: "#fb923c" }}>R{markupAmt.toFixed(2)}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(34,197,94,0.7)" }}>Customer Price</p>












                </div>
              </div>
            )}

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

            {quotes.map((quote) => { const now2=Date.now(); const isStale=!quote.sale_id&&(now2-new Date(quote.created_at).getTime())>172800000; const daysOld=Math.floor((now2-new Date(quote.created_at).getTime())/86400000); return (
              <div key={quote.id} className="rounded-2xl overflow-hidden" style={cardStyle}>
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
                        Send Confirmation
                      </button>
                    )}
                    {!quote.supplier_confirmed && (
                      <button onClick={() => { setConfirmModal(quote); setConfirmImage(null); setConfirmNote(""); }}
                        className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                        style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}>
                        Upload Confirmation
                      </button>
                    )}
                    <button onClick={() => window.open("https://wa.me/" + quote.suppliers?.whatsapp_number?.replace(/\D/g, ""))}
                      className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                      style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.15)", color: "#25D366" }}>
                      WhatsApp Supplier
                    </button>

                    {/* PDF QUOTE BUTTON */}
                    <button onClick={() => printQuote(quote)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                      style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "#c084fc" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      Print Quote
                    </button>
                    <button onClick={() => printInvoice(quote)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                      style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.2)", color: "#2dd4bf" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      Print Invoice
                    </button>

                    {!quote.rejected && (<button onClick={() => convertToSale(quote)}
                      className="px-3 py-2 rounded-lg text-[12px] font-bold cursor-pointer transition text-white"
                      style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 12px rgba(249,115,22,0.2)" }}>
                      Convert to Sale
                    </button>)}
                    {!quote.rejected && (<button onClick={() => { setEditingQuote(quote); setEditPrice(String(quote.supplier_price)); setEditMarkup(String(Math.round((Number(quote.marked_up_price) / Number(quote.supplier_price) - 1) * 100))); }}
                      className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                      style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)", color: "#fb923c" }}>
                      Edit Price
                    </button>)}
                    
                    {!quote.rejected && !quote.sale_id && (
                      <button onClick={() => { setRejectModal(quote); setRejectReason(""); }}
                        className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                        Reject
                      </button>
                    )}
                    {quote.rejected && (
                      <span className="px-3 py-2 rounded-lg text-[12px] font-medium"
                        style={{ background: "rgba(239,68,68,0.06)", color: "#f87171" }}>
                        Rejected
                      </span>
                    )}
<button onClick={() => deleteQuote(quote.id)}
                      className="px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition ml-auto"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
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

      {/* EDIT PRICE MODAL */}
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
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}><p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Markup %</p><button onClick={getAiSuggestion} disabled={loadingAi} className="px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>{loadingAi ? "Thinking..." : "AI Suggest"}</button></div>{aiSuggestion && (<div className="rounded-xl p-3 mb-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}><div className="flex justify-between text-[12px] mb-1"><span className="font-semibold" style={{ color: "#a78bfa" }}>AI: {aiSuggestion.markup}% markup</span><span className="text-white font-bold">R{aiSuggestion.selling_price}</span></div><p className="text-[11px] text-gray-500">{aiSuggestion.reason}</p></div>)}
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

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setRejectModal(null); }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Reject Quote</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Mark this quote as rejected — customer said no or price too high</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Reason (optional)</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {["Price too high", "Found elsewhere", "No longer needed", "No response"].map(r => (
                    <button key={r} onClick={() => setRejectReason(r)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition"
                      style={rejectReason === r
                        ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                      {r}
                    </button>
                  ))}
                </div>
                <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Or type a custom reason..."
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={rejectQuote} disabled={rejecting}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: rejecting ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.8)", border: "none" }}>
                  {rejecting ? "Rejecting..." : "Confirm Reject"}
                </button>
                <button onClick={() => setRejectModal(null)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
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
