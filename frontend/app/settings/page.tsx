"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const darkBg = { minHeight: "100vh", background: "#0e0e0e", color: "white", overflowX: "hidden" as const };
const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };

const NAV_LINKS = [
  { label: "Requests", href: "/admin" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Sales", href: "/sales" },
  { label: "Customers", href: "/customers" },
  { label: "Expenses", href: "/expenses" },
  { label: "Analytics", href: "/analytics" },
  { label: "Reminders", href: "/reminders" },
  { label: "⚙ Settings", href: "/settings", active: true },
];

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "white",
  padding: "10px 14px", width: "100%",
  outline: "none", fontSize: 13,
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backing, setBacking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    business_name: "Cape Parts Finder",
    owner_name: "",
    whatsapp_number: "27696863952",
    email: "",
    website: "cape-parts-finder.vercel.app",
    address: "",
    bank_name: "First National Bank (FNB)",
    bank_account_name: "Cape Parts Finder",
    bank_account_number: "62863344596",
    bank_account_type: "Savings Account",
    vat_number: "",
    tagline: "Your Trusted Auto Parts Network · Cape Town",
    msg_searching: "",
    msg_quoted: "",
    msg_ordered: "",
    msg_delivered: "",
    msg_followup: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      fetchSettings();
    });
  }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data } = await supabase.from("settings").select("*").limit(1).single();
    if (data) {
      setForm({
        business_name: data.business_name || "Cape Parts Finder",
        owner_name: data.owner_name || "",
        whatsapp_number: data.whatsapp_number || "27696863952",
        email: data.email || "",
        website: data.website || "cape-parts-finder.vercel.app",
        address: data.address || "",
        bank_name: data.bank_name || "First National Bank (FNB)",
        bank_account_name: data.bank_account_name || "Cape Parts Finder",
        bank_account_number: data.bank_account_number || "62863344596",
        bank_account_type: data.bank_account_type || "Savings Account",
        vat_number: data.vat_number || "",
        tagline: data.tagline || "Your Trusted Auto Parts Network · Cape Town",
        msg_searching: data.msg_searching || "",
        msg_quoted: data.msg_quoted || "",
        msg_ordered: data.msg_ordered || "",
        msg_delivered: data.msg_delivered || "",
        msg_followup: data.msg_followup || "",
      });
    }
    setLoading(false);
  }

  async function exportAllData() {
    setBacking(true);
    try {
      const [
        { data: requests },
        { data: sales },
        { data: quotes },
        { data: suppliers },
        { data: expenses },
        { data: reviews },
        { data: reminders },
        { data: settings },
      ] = await Promise.all([
        supabase.from("parts_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("sales").select("*").order("created_at", { ascending: false }),
        supabase.from("supplier_quotes").select("*").order("created_at", { ascending: false }),
        supabase.from("suppliers").select("*").order("name"),
        supabase.from("expenses").select("*").order("date", { ascending: false }),
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("reminders").select("*").order("remind_at", { ascending: false }),
        supabase.from("settings").select("*"),
      ]);

      const backup = {
        exported_at: new Date().toISOString(),
        business: "Cape Parts Finder",
        data: { requests, sales, quotes, suppliers, expenses, reviews, reminders, settings },
        counts: {
          requests: requests?.length || 0,
          sales: sales?.length || 0,
          quotes: quotes?.length || 0,
          suppliers: suppliers?.length || 0,
          expenses: expenses?.length || 0,
          reviews: reviews?.length || 0,
        }
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `cape-parts-finder-backup-${date}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Backup failed. Please try again.");
    }
    setBacking(false);
  }

  async function saveSettings() {
    setSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };
    const { data: existing } = await supabase.from("settings").select("id").limit(1).single();
    if (existing) {
      await supabase.from("settings").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("settings").insert([payload]);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function Field({ label, field, placeholder, type = "text" }: { label: string; field: keyof typeof form; placeholder?: string; type?: string }) {
    return (
      <div>
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">{label}</label>
        <input
          type={type}
          style={inputStyle}
          placeholder={placeholder}
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        />
      </div>
    );
  }

  if (loading) return (
    <main style={darkBg} className="flex items-center justify-center">
      <div className="flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 20px" }}>
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <p className="text-gray-300 text-sm">Loading settings...</p>
      </div>
    </main>
  );

  return (
    <main style={darkBg}>
      {/* NAV */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="max-w-3xl mx-auto px-3 h-14 flex items-center gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <span className="font-bold text-white text-[14px] hidden md:block">Cape Parts Finder</span>
          </div>
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide flex-1 mx-1">
            {NAV_LINKS.map(n => (
              <a key={n.href} href={n.href}
                className="px-2.5 py-1.5 rounded-lg text-[11px] no-underline transition font-medium whitespace-nowrap flex-shrink-0"
                style={n.active ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" } : { color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }}>
                {n.label}
              </a>
            ))}
          </div>





        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* BUSINESS INFO */}
        <div style={cardStyle} className="p-5">
          <h2 className="font-bold text-[15px] text-white mb-1">Business Information</h2>
          <p className="text-[12px] text-gray-500 mb-4">Used on quotes, invoices and WhatsApp messages</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business Name" field="business_name" placeholder="Cape Parts Finder" />
            <Field label="Owner Name" field="owner_name" placeholder="Your name" />
            <Field label="Tagline" field="tagline" placeholder="Your trusted auto parts network" />
            <Field label="Website" field="website" placeholder="cape-parts-finder.vercel.app" />
            <Field label="Email" field="email" placeholder="your@email.com" type="email" />
            <Field label="Address" field="address" placeholder="Cape Town, South Africa" />
          </div>
        </div>

        {/* CONTACT */}
        <div style={cardStyle} className="p-5">
          <h2 className="font-bold text-[15px] text-white mb-1">Contact Details</h2>
          <p className="text-[12px] text-gray-500 mb-4">Your WhatsApp number used for customer communication</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">WhatsApp Number</label>
              <div className="flex gap-2">
                <div className="px-3 py-2.5 rounded-xl text-[13px] text-gray-500 flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>+</div>
                <input type="tel" style={inputStyle} placeholder="27696863952"
                  value={form.whatsapp_number}
                  onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value.replace(/\D/g, "") }))} />
              </div>
              <p className="text-[11px] text-gray-600 mt-1">Include country code — e.g. 27696863952 for SA</p>
            </div>
            <Field label="VAT Number (optional)" field="vat_number" placeholder="e.g. 4123456789" />
          </div>

          {/* WhatsApp preview */}
          <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.15)" }}>
            <p className="text-[11px] text-gray-500 mb-1">WhatsApp link preview</p>
            <p className="text-[12px] font-mono" style={{ color: "#25D366" }}>
              https://wa.me/{form.whatsapp_number}
            </p>
          </div>
        </div>

        {/* BANKING */}
        <div style={cardStyle} className="p-5">
          <h2 className="font-bold text-[15px] text-white mb-1">Banking Details</h2>
          <p className="text-[12px] text-gray-500 mb-4">Printed on quotes and invoices for customer payments</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Bank Name" field="bank_name" placeholder="First National Bank (FNB)" />
            <Field label="Account Name" field="bank_account_name" placeholder="Cape Parts Finder" />
            <Field label="Account Number" field="bank_account_number" placeholder="62863344596" />
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Account Type</label>
              <select style={inputStyle} value={form.bank_account_type}
                onChange={e => setForm(f => ({ ...f, bank_account_type: e.target.value }))}>
                {["Savings Account", "Cheque Account", "Current Account", "Business Account"].map(t => (
                  <option key={t} value={t} style={{ background: "#1a1a1a" }}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Banking preview */}
          <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600 mb-3">As shown on invoices</p>
            <div className="space-y-1.5 text-[12px]">
              {[
                { label: "Bank", value: form.bank_name },
                { label: "Account Name", value: form.bank_account_name },
                { label: "Account Number", value: form.bank_account_number },
                { label: "Account Type", value: form.bank_account_type },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="text-white font-medium">{row.value || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        {/* MESSAGE TEMPLATES */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }} className="p-5">
          <h2 className="font-bold text-[15px] text-white mb-1">WhatsApp Message Templates</h2>
          <p className="text-[12px] text-gray-500 mb-1">Customise messages sent to customers. Use <span style={{ color: "#fb923c" }}>{"{name}"}</span>, <span style={{ color: "#fb923c" }}>{"{part}"}</span>, <span style={{ color: "#fb923c" }}>{"{vehicle}"}</span> as placeholders.</p>
          <p className="text-[11px] text-gray-600 mb-4">Leave blank to use the default message.</p>
          <div className="space-y-4">
            {[
              { label: "Searching for Part", key: "msg_searching", placeholder: "Hi {name}, we are actively searching for your {part}..." },
              { label: "Quote Ready", key: "msg_quoted", placeholder: "Hi {name}, great news! We have a quote for your {part}..." },
              { label: "Part Ordered", key: "msg_ordered", placeholder: "Hi {name}, your {part} has been ordered..." },
              { label: "Part Delivered", key: "msg_delivered", placeholder: "Hi {name}, your {part} has been delivered..." },
              { label: "Follow Up", key: "msg_followup", placeholder: "Hi {name}, just checking in on your {part} request..." },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                <textarea
                  rows={3}
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form] || ""}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white placeholder-gray-600 resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* BACKUP SECTION */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }} className="p-5">
          <h2 className="font-bold text-[15px] text-white mb-1">Data Backup</h2>
          <p className="text-[12px] text-gray-500 mb-4">Download all your business data as a JSON file. Save it to Google Drive or your computer weekly.</p>
          <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
            <p className="text-[12px] text-gray-400">Includes: all requests, sales, quotes, suppliers, expenses, reviews and reminders.</p>
          </div>
          <button onClick={exportAllData} disabled={backing}
            className="w-full py-3 rounded-xl text-[14px] font-bold cursor-pointer transition text-white flex items-center justify-center gap-2"
            style={{ background: backing ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: backing ? "rgba(255,255,255,0.4)" : "white" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {backing ? "Preparing backup..." : "Download Full Backup"}
          </button>
        </div>

        <button onClick={saveSettings} disabled={saving}
          className="w-full py-3.5 rounded-2xl text-[15px] font-bold cursor-pointer transition text-white"
          style={{ background: saved ? "rgba(34,197,94,0.8)" : saving ? "rgba(249,115,22,0.5)" : "linear-gradient(135deg,#f97316,#ea580c)", border: "none", boxShadow: "0 4px 20px rgba(249,115,22,0.25)" }}>
          {saved ? "✓ Settings Saved!" : saving ? "Saving..." : "Save Settings"}
        </button>

        <p className="text-center text-gray-600 text-[12px] pb-4">
          Changes apply to new quotes and invoices immediately
        </p>
      </div>
    </main>
  );
}
