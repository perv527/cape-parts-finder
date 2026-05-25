"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function SuppliersContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const requestPart = searchParams.get("part") || "";
  const requestMake = searchParams.get("make") || "";
  const requestModel = searchParams.get("model") || "";
  const requestYear = searchParams.get("year") || "";
  const requestPhoto = searchParams.get("photo") || "";
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [quoteModal, setQuoteModal] = useState<any>(null);
  const [quoteImage, setQuoteImage] = useState<File | null>(null);
  const [quoteNote, setQuoteNote] = useState("");
  const [sendingQuote, setSendingQuote] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "", contact_person: "", whatsapp_number: "",
    email: "", area: "", speciality: "",
  });

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setAuthChecked(true);
    fetchSuppliers();
  }

  async function fetchSuppliers() {
    const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    if (!error && data) setSuppliers(data);
  }

  async function saveSupplier() {
    if (!formData.name || !formData.whatsapp_number) { alert("Name and WhatsApp number are required"); return; }
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
    setFormData({
      name: supplier.name || "", contact_person: supplier.contact_person || "",
      whatsapp_number: supplier.whatsapp_number || "", email: supplier.email || "",
      area: supplier.area || "", speciality: supplier.speciality || "",
    });
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
    if (!quoteImage) { alert("Please attach an image first"); return; }
    setSendingQuote(true);

    try {
      const fileExt = quoteImage.name.split(".").pop();
      const fileName = `quote-${quoteModal.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("quote-images")
        .upload(fileName, quoteImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("quote-images").getPublicUrl(fileName);

      await supabase.from("supplier_quotes").insert([{
        supplier_id: quoteModal.id,
        supplier_name: quoteModal.name,
        supplier_whatsapp: quoteModal.whatsapp_number,
        image_url: publicUrl,
        note: quoteNote,
        status: "sent",
      }]);

      setQuoteSuccess(true);
      setTimeout(() => {
        setQuoteModal(null); setQuoteImage(null);
        setQuoteNote(""); setQuoteSuccess(false);
      }, 2000);
    } catch (err) {
      alert("Failed to send quote. Please try again.");
    }
    setSendingQuote(false);
  }

  const filteredSuppliers = suppliers.filter((s) =>
    (s.name + " " + s.area + " " + s.speciality).toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = suppliers.filter((s) => s.active).length;

  if (!authChecked) {
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
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-orange-500 flex items-center justify-center flex-shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-[15px] text-gray-900 leading-tight">Cape Parts Finder</div>
              <div className="text-[11px] text-gray-400">Admin Dashboard</div>
            </div>
          </div>
          <div className="flex gap-1">
            <a href="/admin" className="px-4 py-1.5 rounded-lg text-sm no-underline text-gray-500 hover:bg-gray-50">Requests</a>
            <a href="/suppliers" className="px-4 py-1.5 rounded-lg text-sm no-underline font-semibold bg-orange-50 text-orange-600">Suppliers</a>
            <a href="/sales" className="px-4 py-1.5 rounded-lg text-sm no-underline text-gray-500 hover:bg-gray-50">Sales</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-medium transition cursor-pointer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Supplier
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-7">

        {/* â”€â”€ PAGE HEADER â”€â”€ */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Suppliers</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your supplier network and send quote requests</p>
        </div>

        {/* â”€â”€ STATS â”€â”€ */}
        <div className="grid grid-cols-3 gap-3.5 mb-6">
          {[
            { label: "Total Suppliers", value: suppliers.length,              accent: "#F97316" },
            { label: "Active",          value: activeCount,                   accent: "#22C55E" },
            { label: "Inactive",        value: suppliers.length - activeCount, accent: "#9CA3AF" },
          ].map((card, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: card.accent }} />
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{card.label}</p>
              <p className="text-[38px] font-bold text-gray-900 leading-none mt-2 tracking-tight">{card.value}</p>
            </div>
          ))}
        </div>

        {/* â”€â”€ SEARCH â”€â”€ */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search suppliers by name, area or speciality..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100" />
          </div>
        </div>

        {/* â”€â”€ ADD / EDIT FORM â”€â”€ */}
        {showForm && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[17px] font-bold text-gray-900">{editingId ? "Edit Supplier" : "Add New Supplier"}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-700 text-xl cursor-pointer bg-transparent border-none">Ã—</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { name: "name",             placeholder: "Business Name *" },
                { name: "contact_person",   placeholder: "Contact Person" },
                { name: "whatsapp_number",  placeholder: "WhatsApp Number *" },
                { name: "email",            placeholder: "Email" },
                { name: "area",             placeholder: "Area" },
                { name: "speciality",       placeholder: "Speciality (e.g. Engine parts)" },
              ].map((field) => (
                <input key={field.name} name={field.name} placeholder={field.placeholder}
                  value={formData[field.name as keyof typeof formData]}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100" />
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveSupplier}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer">
                {editingId ? "Update Supplier" : "Save Supplier"}
              </button>
              <button onClick={resetForm}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ SUPPLIER CARDS â”€â”€ */}
        <div className="grid xl:grid-cols-2 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Card header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-[15px] flex-shrink-0">
                      {(supplier.name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-[15px] text-gray-900">{supplier.name}</h2>
                        <span className={`w-2 h-2 rounded-full ${supplier.active ? "bg-green-500" : "bg-gray-300"}`} />
                      </div>
                      <p className="text-[12px] text-gray-400 mt-0.5">{supplier.speciality || "General Parts"}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${supplier.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {supplier.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  {[
                    { label: "Contact",  value: supplier.contact_person },
                    { label: "Area",     value: supplier.area },
                    { label: "WhatsApp", value: supplier.whatsapp_number },
                    { label: "Email",    value: supplier.email },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                      <p className="font-medium text-gray-900 mt-0.5 text-[13px]">{value || "â€”"}</p>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button onClick={() => window.open("https://wa.me/" + (supplier.whatsapp_number || "").replace(/\D/g, ""))}
                    className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    WhatsApp
                  </button>
                  <button onClick={() => window.open("mailto:" + supplier.email)}
                    className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
                    Email
                  </button>
                  <button onClick={() => editSupplier(supplier)}
                    className="bg-gray-900 hover:bg-black text-white py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
                    Edit
                  </button>
                  <button onClick={() => toggleActive(supplier.id, supplier.active)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
                    {supplier.active ? "Deactivate" : "Activate"}
                  </button>
                </div>

                {/* Send Quote button */}
                <button onClick={() => { setQuoteModal(supplier); setQuoteImage(null); setQuoteNote(""); setQuoteSuccess(false); }}
                  className="w-full flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 py-2.5 rounded-lg text-[13px] font-semibold transition cursor-pointer mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Send Quote Request
                </button>

                <button onClick={() => deleteSupplier(supplier.id)}
                  className="w-full border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
                  Delete Supplier
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ QUOTE MODAL â”€â”€ */}
      {quoteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[16px] text-gray-900">Send Quote Request</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">To: {quoteModal.name}</p>
              </div>
              <button onClick={() => setQuoteModal(null)} className="text-gray-400 hover:text-gray-700 text-xl cursor-pointer bg-transparent border-none">Ã—</button>
            </div>

            <div className="p-5 space-y-4">
              {quoteSuccess ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-900">Quote sent successfully!</p>
                  <p className="text-sm text-gray-400 mt-1">The supplier will confirm and you can forward to the customer.</p>
                </div>
              ) : (
                <>
                  {/* Image upload */}
                  <div>
                    <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                      Quote Image *
                    </label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-orange-300 transition cursor-pointer"
                      onClick={() => document.getElementById("quote-image-input")?.click()}>
                      {quoteImage ? (
                        <div>
                          <img src={URL.createObjectURL(quoteImage)} alt="Preview" className="w-full max-h-40 object-contain rounded-lg mb-2" />
                          <p className="text-[12px] text-gray-500">{quoteImage.name}</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="mx-auto mb-2 text-gray-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <p className="text-sm text-gray-400">Click to upload quote image</p>
                          <p className="text-[11px] text-gray-300 mt-1">JPG, PNG, PDF supported</p>
                        </div>
                      )}
                    </div>
                    <input id="quote-image-input" type="file" accept="image/*,.pdf" className="hidden"
                      onChange={(e) => setQuoteImage(e.target.files?.[0] || null)} />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                      Note to Supplier (optional)
                    </label>
                    <textarea
                      value={quoteNote}
                      onChange={(e) => setQuoteNote(e.target.value)}
                      placeholder="e.g. Need urgent delivery, customer is in Bellville..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-orange-300 resize-none" />
                  </div>

                  {/* Supplier contact info */}
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                    <p className="text-[11px] font-semibold text-orange-700 uppercase tracking-wide mb-1">Supplier Contact</p>
                    <p className="text-sm text-gray-700 font-medium">{quoteModal.whatsapp_number}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5">After saving, send via WhatsApp for supplier confirmation</p>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button onClick={sendQuoteToSupplier} disabled={sendingQuote || !quoteImage}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white py-2.5 rounded-lg text-[13px] font-semibold transition cursor-pointer">
                      {sendingQuote ? "Saving..." : "Save & Send via WhatsApp"}
                    </button>
                    <button onClick={() => setQuoteModal(null)}
                      className="px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-[13px] font-medium transition cursor-pointer">
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
    <Suspense fallback={<div className='min-h-screen bg-[#FAFAF9]' />}>
      <SuppliersContent />
    </Suspense>
  );
}
