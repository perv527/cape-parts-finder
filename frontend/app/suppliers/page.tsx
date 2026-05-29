"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function StarRating({ rating, onRate, readonly }: { rating: number; onRate?: (r: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          onClick={() => !readonly && onRate?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={readonly ? "cursor-default" : "cursor-pointer"}
          style={{ background: "none", border: "none", padding: "1px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill={(hover || rating) >= star ? "#f97316" : "none"}
            stroke={(hover || rating) >= star ? "#f97316" : "rgba(255,255,255,0.2)"}
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

function SuppliersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const requestPart = searchParams.get("part") || "";
  const requestMake = searchParams.get("make") || "";
  const requestModel = searchParams.get("model") || "";
  const requestYear = searchParams.get("year") || "";
  const requestPhoto = searchParams.get("photo") || "";
  const requestVin = searchParams.get("vin") || "";

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Record<number, { avg: number; count: number; list: any[] }>>({});
  const [authChecked, setAuthChecked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [quoteModal, setQuoteModal] = useState<any>(null);
  const [quoteImage, setQuoteImage] = useState<File | null>(null);
  const [quoteNote, setQuoteNote] = useState("");
  const [sendingQuote, setSendingQuote] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [ratingModal, setRatingModal] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingNote, setRatingNote] = useState("");
  const [savingRating, setSavingRating] = useState(false);
  const [formData, setFormData] = useState({ name: "", contact_person: "", whatsapp_number: "", email: "", area: "", speciality: "" });

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setAuthChecked(true);
    fetchSuppliers();
    fetchRatings();
  }

  async function fetchSuppliers() {
    const { data } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    if (data) setSuppliers(data);
  }

  async function fetchRatings() {
    const { data } = await supabase.from("supplier_ratings").select("*").order("created_at", { ascending: false });
    if (!data) return;
    const map: Record<number, { avg: number; count: number; list: any[] }> = {};
    data.forEach((r: any) => {
      if (!map[r.supplier_id]) map[r.supplier_id] = { avg: 0, count: 0, list: [] };
      map[r.supplier_id].list.push(r);
      map[r.supplier_id].count++;
    });
    Object.keys(map).forEach(id => {
      const entry = map[Number(id)];
      entry.avg = entry.list.reduce((s, r) => s + r.rating, 0) / entry.count;
    });
    setRatings(map);
  }

  async function saveRating() {
    if (!ratingValue) { alert("Please select a rating"); return; }
    setSavingRating(true);
    await supabase.from("supplier_ratings").insert([{
      supplier_id: ratingModal.id,
      rating: ratingValue,
      note: ratingNote || null,
    }]);
    setRatingModal(null); setRatingValue(0); setRatingNote("");
    fetchRatings();
    setSavingRating(false);
  }

  async function saveSupplier() {
    if (!formData.name || !formData.whatsapp_number) { alert("Name and WhatsApp required"); return; }
    if (editingId) {
      await supabase.from("suppliers").update(formData).eq("id", editingId);
    } else {
      await supabase.from("suppliers").insert([formData]);
    }
    resetForm(); fetchSuppliers();
  }

  async function deleteSupplier(id: number) {
    if (!confirm("Delete this supplier?")) return;
    await supabase.from("suppliers").delete().eq("id", id);
    fetchSuppliers();
  }

  async function toggleActive(id: number, active: boolean) {
    await supabase.from("suppliers").update({ active: !active }).eq("id", id);
    fetchSuppliers();
  }

  function editSupplier(supplier: any) {
    setFormData({ name: supplier.name || "", contact_person: supplier.contact_person || "", whatsapp_number: supplier.whatsapp_number || "", email: supplier.email || "", area: supplier.area || "", speciality: supplier.speciality || "" });
    setEditingId(supplier.id); setShowForm(true);
  }

  function resetForm() {
    setFormData({ name: "", contact_person: "", whatsapp_number: "", email: "", area: "", speciality: "" });
    setEditingId(null); setShowForm(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function sendQuoteToSupplier() {
    setSendingQuote(true);
    try {
      let imageUrl = null;
      if (quoteImage) {
        const ext = quoteImage.name.split(".").pop();
        const fn = `quote-${quoteModal.id}-${Date.now()}.${ext}`;
        const { error: ue } = await supabase.storage.from("quote-images").upload(fn, quoteImage);
        if (!ue) {
          const { data: { publicUrl } } = supabase.storage.from("quote-images").getPublicUrl(fn);
          imageUrl = publicUrl;
        }
      }
      const { error } = await supabase.from("supplier_quotes").insert([{ supplier_id: quoteModal.id, notes: quoteNote, status: "sent", quote_image_url: imageUrl }]);
      if (error) throw error;
      setQuoteSuccess(true);
      setTimeout(() => { setQuoteModal(null); setQuoteImage(null); setQuoteNote(""); setQuoteSuccess(false); }, 2000);
    } catch (err: any) { alert("Failed: " + err.message); }
    setSendingQuote(false);
  }

  function openQuoteModal(supplier: any) {
    setQuoteModal(supplier); setQuoteImage(null); setQuoteSuccess(false);
    if (requestId) {
      setQuoteNote(`Part needed: ${requestPart}\nVehicle: ${requestYear} ${requestMake} ${requestModel}${requestVin ? "\nVIN: " + requestVin : ""}`);
    } else { setQuoteNote(""); }
  }

  const filteredSuppliers = suppliers.filter(s => (s.name + " " + s.area + " " + s.speciality).toLowerCase().includes(search.toLowerCase()));
  const activeCount = suppliers.filter(s => s.active).length;

  const darkBg = { background: "#111111", minHeight: "100vh" };
  const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" };
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };
  const inputClass = "rounded-xl px-4 py-3 text-[13px] outline-none text-white placeholder-gray-600 transition";

  if (!authChecked) {
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
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* NAV */}
        <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", background: "rgba(17,17,17,0.85)", position: "sticky", top: 0, zIndex: 50 }}>
          <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center" style={{ boxShadow: "0 0 16px rgba(249,115,22,0.35)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <span className="font-bold text-white text-[14px]">Cape Parts Finder</span>
            </div>
            <div className="flex gap-1">
              {[{ label: "Requests", href: "/admin" }, { label: "Suppliers", href: "/suppliers", active: true }, { label: "Sales", href: "/sales" }, { label: "Analytics", href: "/analytics" }].map((n) => (
                <a key={n.href} href={n.href} className="px-3.5 py-1.5 rounded-lg text-[13px] no-underline transition font-medium"
                  style={n.active ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" } : { color: "rgba(255,255,255,0.4)", border: "1px solid transparent" }}>
                  {n.label}
                </a>
              ))}
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-bold cursor-pointer transition text-white"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 12px rgba(249,115,22,0.25)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Supplier
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-5 py-6">

          {/* ACTIVE REQUEST BANNER */}
          {requestId && (
            <div className="rounded-2xl p-4 mb-5 flex items-start gap-4" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0" style={{ boxShadow: "0 0 16px rgba(249,115,22,0.3)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-bold text-orange-400 mb-0.5">Active Request — Click "Send Quote Request" on any supplier</p>
                <p className="text-[12px] text-orange-300">
                  Part: <strong>{requestPart}</strong> · Vehicle: <strong>{requestYear} {requestMake} {requestModel}</strong>
                  {requestVin && <> · VIN: <strong>{requestVin}</strong></>}
                </p>
                {requestPhoto && <img src={requestPhoto} alt="Customer photo" className="w-16 h-16 object-cover rounded-lg mt-2 cursor-pointer" style={{ border: "1px solid rgba(249,115,22,0.3)" }} onClick={() => window.open(requestPhoto)} />}
              </div>
              <button onClick={() => router.push("/admin")} className="text-orange-400 hover:text-orange-200 text-xl cursor-pointer bg-transparent border-none">×</button>
            </div>
          )}

          {/* STATS */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Total Suppliers", value: suppliers.length, color: "#fb923c" },
              { label: "Active", value: activeCount, color: "#4ade80" },
              { label: "Inactive", value: suppliers.length - activeCount, color: "#6b7280" },
            ].map((card) => (
              <div key={card.label} className="rounded-xl p-4 relative overflow-hidden" style={cardStyle}>
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ background: card.color }} />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{card.label}</p>
                <p className="text-[32px] font-black leading-none" style={{ color: card.color }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* SEARCH */}
          <div className="rounded-xl p-4 mb-4" style={cardStyle}>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search suppliers by name, area or speciality..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-[13px] outline-none text-white placeholder-gray-600" style={inputStyle} />
            </div>
          </div>

          {/* ADD/EDIT FORM */}
          {showForm && (
            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-[15px] text-white">{editingId ? "Edit Supplier" : "Add New Supplier"}</h2>
                <button onClick={resetForm} className="text-gray-500 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { name: "name", placeholder: "Business Name *" },
                  { name: "contact_person", placeholder: "Contact Person" },
                  { name: "whatsapp_number", placeholder: "WhatsApp Number *" },
                  { name: "email", placeholder: "Email" },
                  { name: "area", placeholder: "Area" },
                  { name: "speciality", placeholder: "Speciality (e.g. Engine parts)" },
                ].map((field) => (
                  <input key={field.name} name={field.name} placeholder={field.placeholder}
                    value={formData[field.name as keyof typeof formData]} onChange={handleChange}
                    className={`w-full ${inputClass}`} style={inputStyle} />
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={saveSupplier}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition text-white"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                  {editingId ? "Update Supplier" : "Save Supplier"}
                </button>
                <button onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* SUPPLIER CARDS */}
          <div className="grid xl:grid-cols-2 gap-3">
            {filteredSuppliers.map((supplier) => {
              const supplierRating = ratings[supplier.id];
              return (
                <div key={supplier.id} className="rounded-2xl overflow-hidden transition" style={{ ...cardStyle, border: requestId ? "1px solid rgba(249,115,22,0.15)" : "1px solid rgba(255,255,255,0.07)" }}>

                  <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-orange-400 font-bold text-[14px]"
                          style={{ background: "rgba(249,115,22,0.12)" }}>
                          {(supplier.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-bold text-[14px] text-white">{supplier.name}</h2>
                            <span className={`w-1.5 h-1.5 rounded-full ${supplier.active ? "bg-green-400" : "bg-gray-600"}`} />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">{supplier.speciality || "General Parts"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                          style={supplier.active ? { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" } : { background: "rgba(107,114,128,0.1)", color: "#6b7280", border: "1px solid rgba(107,114,128,0.2)" }}>
                          {supplier.active ? "Active" : "Inactive"}
                        </span>
                        {/* Rating display */}
                        {supplierRating ? (
                          <div className="flex items-center gap-1.5">
                            <StarRating rating={Math.round(supplierRating.avg)} readonly />
                            <span className="text-[10px] text-gray-500">{supplierRating.avg.toFixed(1)} ({supplierRating.count})</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-700">No ratings yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2 mb-3 text-[12px]">
                      {[{ label: "Contact", value: supplier.contact_person }, { label: "Area", value: supplier.area }, { label: "WhatsApp", value: supplier.whatsapp_number }, { label: "Email", value: supplier.email }].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</p>
                          <p className="text-gray-300 font-medium text-[12px]">{value || "—"}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button onClick={() => window.open("https://wa.me/" + (supplier.whatsapp_number || "").replace(/\D/g, ""))}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                        style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.15)", color: "#25D366" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                        WhatsApp
                      </button>
                      <button onClick={() => window.open("mailto:" + supplier.email)}
                        className="py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                        Email
                      </button>
                      <button onClick={() => editSupplier(supplier)}
                        className="py-2 rounded-lg text-[12px] font-medium cursor-pointer transition text-white"
                        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        Edit
                      </button>
                      <button onClick={() => toggleActive(supplier.id, supplier.active)}
                        className="py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                        {supplier.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>

                    {/* Rate supplier button */}
                    <button onClick={() => { setRatingModal(supplier); setRatingValue(0); setRatingNote(""); }}
                      className="w-full py-2 rounded-xl text-[12px] font-medium cursor-pointer transition mb-2"
                      style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)", color: "#fb923c" }}>
                      ⭐ Rate this Supplier
                    </button>

                    <button onClick={() => openQuoteModal(supplier)}
                      className="w-full py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition mb-2 text-white"
                      style={requestId
                        ? { background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 12px rgba(249,115,22,0.25)" }
                        : { background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>
                      {requestId ? "Send Quote Request for This Part" : "Send Quote Request"}
                    </button>

                    <button onClick={() => deleteSupplier(supplier.id)}
                      className="w-full py-2 rounded-xl text-[12px] font-medium cursor-pointer transition"
                      style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", color: "#f87171" }}>
                      Delete Supplier
                    </button>

                    {/* Rating history */}
                    {supplierRating && supplierRating.list.length > 0 && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Rating History</p>
                        <div className="space-y-1.5">
                          {supplierRating.list.slice(0, 3).map((r: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <StarRating rating={r.rating} readonly />
                              <span className="text-[10px] text-gray-600">{new Date(r.created_at).toLocaleDateString("en-ZA")}</span>
                              {r.note && <span className="text-[10px] text-gray-500 truncate flex-1">{r.note}</span>}
                            </div>
                          ))}
                          {supplierRating.list.length > 3 && (
                            <p className="text-[10px] text-gray-700">+{supplierRating.list.length - 3} more ratings</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RATING MODAL */}
      {ratingModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h2 className="font-bold text-[15px] text-white">Rate Supplier</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">{ratingModal.name}</p>
              </div>
              <button onClick={() => setRatingModal(null)} className="text-gray-500 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[11px] text-gray-500 mb-3">How would you rate this supplier?</p>
                <div className="flex justify-center">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRatingValue(star)}
                        className="cursor-pointer transition"
                        style={{ background: "none", border: "none", padding: "4px" }}>
                        <svg width="32" height="32" viewBox="0 0 24 24"
                          fill={ratingValue >= star ? "#f97316" : "none"}
                          stroke={ratingValue >= star ? "#f97316" : "rgba(255,255,255,0.2)"}
                          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                          style={{ transform: ratingValue >= star ? "scale(1.15)" : "scale(1)", transition: "transform 0.1s" }}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                {ratingValue > 0 && (
                  <p className="text-center text-[12px] mt-2" style={{ color: "#fb923c" }}>
                    {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][ratingValue]}
                  </p>
                )}
              </div>
              <textarea value={ratingNote} onChange={(e) => setRatingNote(e.target.value)} rows={2}
                placeholder="Add a note (optional)..."
                className="w-full rounded-xl px-4 py-3 text-[13px] outline-none resize-none text-white placeholder-gray-600"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
              <div className="flex gap-2">
                <button onClick={saveRating} disabled={savingRating || !ratingValue}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition text-white"
                  style={{ background: ratingValue ? "linear-gradient(135deg, #f97316, #ea580c)" : "rgba(249,115,22,0.3)", boxShadow: ratingValue ? "0 4px 16px rgba(249,115,22,0.25)" : "none" }}>
                  {savingRating ? "Saving..." : "Save Rating"}
                </button>
                <button onClick={() => setRatingModal(null)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUOTE MODAL */}
      {quoteModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h2 className="font-bold text-[15px] text-white">Send Quote Request</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">To: {quoteModal.name}</p>
              </div>
              <button onClick={() => setQuoteModal(null)} className="text-gray-500 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>
            </div>

            <div className="p-5 space-y-3">
              {quoteSuccess ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(34,197,94,0.15)" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="font-bold text-white text-[15px]">Quote sent!</p>
                </div>
              ) : (
                <>
                  {requestId && (
                    <div className="rounded-xl p-3" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(249,115,22,0.7)" }}>Customer Request</p>
                      <p className="text-[13px] text-white font-medium">{requestPart}</p>
                      <p className="text-[11px] text-gray-500">{requestYear} {requestMake} {requestModel}{requestVin ? ` · VIN: ${requestVin}` : ""}</p>
                    </div>
                  )}
                  {requestPhoto && (
                    <div className="rounded-xl p-3" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(96,165,250,0.7)" }}>Customer Photo</p>
                      <img src={requestPhoto} alt="Customer part photo" className="w-full max-h-40 object-contain rounded-lg cursor-pointer" onClick={() => window.open(requestPhoto)} />
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Quote Image (optional)</p>
                    <div onClick={() => document.getElementById("quote-image-input")?.click()}
                      className="rounded-xl p-4 text-center cursor-pointer transition"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                      {quoteImage ? (
                        <div className="flex items-center gap-3">
                          <img src={URL.createObjectURL(quoteImage)} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                          <p className="text-[12px] text-gray-400">{quoteImage.name}</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-gray-600">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          <span className="text-[13px]">Click to upload quote image</span>
                        </div>
                      )}
                    </div>
                    <input id="quote-image-input" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setQuoteImage(e.target.files?.[0] || null)} />
                  </div>
                  <textarea value={quoteNote} onChange={(e) => setQuoteNote(e.target.value)} rows={3}
                    placeholder="Note to supplier..." className="w-full rounded-xl px-4 py-3 text-[13px] outline-none resize-none text-white placeholder-gray-600"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
                  <div className="flex gap-2">
                    <button onClick={sendQuoteToSupplier} disabled={sendingQuote}
                      className="flex-1 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition text-white"
                      style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 4px 16px rgba(249,115,22,0.25)" }}>
                      {sendingQuote ? "Sending..." : "Save & Send via WhatsApp"}
                    </button>
                    <button onClick={() => setQuoteModal(null)}
                      className="px-4 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={
      <main style={{ background: "#111111", minHeight: "100vh" }} className="flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
      </main>
    }>
      <SuppliersContent />
    </Suspense>
  );
}
