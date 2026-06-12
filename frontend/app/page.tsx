"use client";
import { useState, useEffect } from "react";
import { useSettings } from "@/lib/settings";
import { queueRequest, retryPendingRequests } from "@/lib/offlineQueue";

import { supabase } from "@/lib/supabase";

const VEHICLE_MAKES = ["Audi","BMW","Chevrolet","Chrysler","Citroen","Datsun","Fiat","Ford","GWM","Haval","Honda","Hyundai","Isuzu","Jeep","Kia","Land Rover","Mahindra","Mazda","Mercedes-Benz","MG","Mini","Mitsubishi","Nissan","Opel","Peugeot","Polo","Renault","Subaru","Suzuki","Toyota","Volkswagen","Volvo","Other"];

export default function Home() {
  const settings = useSettings();
  const [requestCount, setRequestCount] = useState<number|null>(null);
  useEffect(() => {
    supabase.from("parts_requests").select("id", { count: "exact", head: true })
      .then(({ count }) => setRequestCount(count));
  }, []);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  function sanitize(val: string) {
    return val.replace(/<[^>]*>/g, "").replace(/[<>"';&]/g, "").trim().slice(0, 500);
  }

  function isValidSAPhone(phone: string) {
    const clean = phone.replace(/\s|-/g, "");
    return /^(\+27|27|0)[6-8][0-9]{8}$/.test(clean);
  }
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("reviews").select("customer_name,rating,comment,part_sourced,created_at")
      .gte("rating", 4).order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setReviews(data || []));
  }, []);
  const [success, setSuccess] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customer_name: "", phone_number: "", email: "", area: "",
    vehicle_make: "", vehicle_model: "", vehicle_year: "",
    engine_size: "", vin_number: "",
    part_needed: "", part_preference: "Aftermarket", extra_details: "",
    referral_source: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files].slice(0, 5));
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
  }

  function canProceed() {
    if (step === 1) return formData.customer_name.trim() && formData.phone_number.trim();
    if (step === 2) return formData.vehicle_make.trim() && formData.vehicle_model.trim();
    if (step === 3) return formData.part_needed.trim();
    return true;
  }

  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX = 1200;
          let w = img.width;
          let h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else { w = Math.round(w * MAX / h); h = MAX; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            if (blob) {
              const compressed = new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() });
              resolve(compressed);
            } else {
              resolve(file);
            }
          }, "image/jpeg", 0.75);
        };
      };
    });
  }

  async function handleSubmit() {
    // Honeypot check - bots fill hidden fields
    if (honeypot) { setLoading(false); return; }

    // Phone validation
    if (!isValidSAPhone(formData.phone_number)) {
      alert("Please enter a valid South African phone number (e.g. 082 123 4567)");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Offline check - queue if no connection
      if (!navigator.onLine) {
        await queueRequest({ ...formData });
        alert("You are offline. Your request has been saved and will be submitted automatically when you reconnect.");
        setLoading(false);
        return;
      }
      // Retry any previously queued requests
      retryPendingRequests(async (payload) => {
        const { error } = await supabase.from("parts_requests").insert([payload]);
        return !error;
      }).catch(() => {});
      // Offline check - queue if no connection
      if (!navigator.onLine) {
        await queueRequest({ ...formData });
        alert("You are offline. Your request has been saved and will be submitted automatically when you reconnect.");
        setLoading(false);
        return;
      }
      // Retry any previously queued requests
      retryPendingRequests(async (payload) => {
        const { error } = await supabase.from("parts_requests").insert([payload]);
        return !error;
      }).catch(() => {});
      // Rate limiting - max 3 requests per phone per 24 hours
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase.from("parts_requests").select("id")
        .eq("phone_number", formData.phone_number.replace(/\s|-/g, ""))
        .gte("created_at", since);
      if (recent && recent.length >= 3) {
        alert("You have submitted 3 requests in the last 24 hours. Please wait before submitting again.");
        setLoading(false);
        return;
      }

      // Sanitize all inputs
      const sanitized = {
        customer_name: sanitize(formData.customer_name),
        phone_number: formData.phone_number.replace(/[^0-9+\s-]/g, "").trim(),
        email: formData.email.replace(/[^a-zA-Z0-9@._+-]/g, "").trim(),
        area: sanitize(formData.area),
        vehicle_make: sanitize(formData.vehicle_make),
        vehicle_model: sanitize(formData.vehicle_model),
        vehicle_year: formData.vehicle_year.replace(/[^0-9]/g, "").slice(0, 4),
        engine_size: sanitize(formData.engine_size),
        vin_number: formData.vin_number.replace(/[^a-zA-Z0-9]/g, "").slice(0, 17),
        part_needed: sanitize(formData.part_needed),
        part_preference: formData.part_preference,
        extra_details: sanitize(formData.extra_details),
        referral_source: formData.referral_source,
      };

      // Duplicate check
      const { data: existing } = await supabase.from("parts_requests").select("id, part_needed, created_at, status")
        .eq("phone_number", sanitized.phone_number).not("status", "in", "(Delivered,Closed)")
        .order("created_at", { ascending: false }).limit(1);
      if (existing && existing.length > 0) {
        const prev = existing[0];
        const date = new Date(prev.created_at).toLocaleDateString("en-ZA");
        const proceed = window.confirm(`You already have an active request for "${prev.part_needed}" submitted on ${date}.\n\nSubmit a new request anyway?`);
        if (!proceed) { setLoading(false); return; }
      }

      // Upload photos
      const uploadedUrls: string[] = [];
      for (const rawPhoto of photos) {
        const photo = await compressImage(rawPhoto);
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const { error: uploadError } = await supabase.storage.from("parts-photos").upload(fileName, photo);
        if (!uploadError) {
          const { data } = supabase.storage.from("parts-photos").getPublicUrl(fileName);
          if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
        }
      }

      const photo_url = uploadedUrls[0] || "";
      const photo_urls = uploadedUrls;
      const { error } = await supabase.from("parts_requests").insert([{ ...sanitized, photo_url, photo_urls }]);
      if (error) { alert("Something went wrong. Please try again."); setLoading(false); return; }
      setSuccess(true);


      // Send confirmation email to customer
      if (sanitized.email) {
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "customer_confirmation",
            to: sanitized.email,
            customerName: sanitized.customer_name,
            partNeeded: sanitized.part_needed,
            vehicle: sanitized.vehicle_year + " " + sanitized.vehicle_make + " " + sanitized.vehicle_model,
            phone: sanitized.phone_number,
          }),
        }).catch(() => {});
      }

      // Auto notify yourself via WhatsApp
      const waMsg = "New Part Request!" +
        "\nName: " + formData.customer_name +
        "\nPhone: " + formData.phone_number +
        "\nVehicle: " + formData.vehicle_year + " " + formData.vehicle_make + " " + formData.vehicle_model +
        "\nPart: " + formData.part_needed +
        "\nPreference: " + formData.part_preference +
        (formData.area ? "\nArea: " + formData.area : "") +
        (formData.referral_source ? "\nFrom: " + formData.referral_source : "");
      const waUrl = "https://wa.me/" + settings.whatsapp_number + "?text=" + encodeURIComponent(waMsg);
      setTimeout(() => window.open(waUrl, "_blank"), 2000);

      // Admin notification email
      fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "admin_notification", to: "safri38@outlook.com", customerName: sanitized.customer_name, partNeeded: sanitized.part_needed, vehicle: (sanitized.vehicle_year + " " + sanitized.vehicle_make + " " + sanitized.vehicle_model).trim(), phone: sanitized.phone_number }) }).catch(() => {});

    } catch (err) { alert("Something went wrong. Please try again."); }
    setLoading(false);
  }

  const inputCls = "w-full rounded-xl px-4 py-3 text-[14px] outline-none transition text-white placeholder-gray-500";
  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" };
  const inputFocus = "focus:border-orange-500/50 focus:bg-white/8";

  if (success) return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a" }} className="flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.1))", border: "2px solid rgba(249,115,22,0.4)" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="text-[28px] font-black text-white mb-3">Request Sent!</h2>
        <p className="text-gray-400 text-[15px] leading-relaxed mb-4">We received your request for a <span style={{ color: "#fb923c" }}>{formData.part_needed}</span>. We will search our supplier network and contact you on <span style={{ color: "#fb923c" }}>{formData.phone_number}</span>.</p>

        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.15)" }}>
          <div className="flex items-center gap-2 mb-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <p className="text-[13px] font-semibold" style={{ color: "#25D366" }}>Typical response time</p>
          </div>
          <p className="text-[13px] text-gray-400">We usually respond within <strong className="text-white">2-4 hours</strong> during business hours (Mon-Sat, 8am-6pm).</p>
        </div>

        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[12px] text-gray-500 mb-2">Track your request anytime</p>
          <a href="/track" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[14px] font-bold text-white no-underline"
            style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
            Track My Request →
          </a>
        </div>

        <div className="rounded-2xl p-3 mb-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[12px] text-gray-600">Need to cancel? Visit the tracking page and cancel before we source your part.</p>
        </div>
        <button onClick={() => { setSuccess(false); setStep(1); setFormData({ customer_name: "", phone_number: "", email: "", area: "", vehicle_make: "", vehicle_model: "", vehicle_year: "", engine_size: "", vin_number: "", part_needed: "", part_preference: "Aftermarket", extra_details: "", referral_source: "" }); setPhotos([]); }}
          className="text-gray-600 text-[13px] cursor-pointer hover:text-gray-400 transition">
          Submit another request
        </button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", overflowX: "hidden" }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* NAV */}
        <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,10,0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 0 20px rgba(249,115,22,0.4)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div>
                <div className="font-black text-white text-[15px] leading-none">Cape Parts Finder</div>
                <div className="text-[10px] text-orange-400/70 leading-none mt-0.5">Cape Town Auto Parts</div>
              </div>
            </div>
            <a href="/track" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium no-underline transition"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              Track Request →
            </a>
          </div>
        </nav>

        {/* HERO */}
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-[12px] font-medium"
              style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", color: "#fb923c" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Free Service · Cape Town & Surrounds
            </div>
            {requestCount && requestCount > 5 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium mt-2"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {requestCount}+ customers found their part
              </div>
            )}
            <h1 className="text-[36px] sm:text-[48px] font-black text-white leading-tight mb-4">
              Find Any Car Part<br />
              <span style={{ background: "linear-gradient(135deg,#f97316,#fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fast in Cape Town</span>
            </h1>
            <p className="text-gray-400 text-[16px] max-w-md mx-auto leading-relaxed">
              Submit your request and we'll search our trusted supplier network to find your part at the best price.
            </p>
          </div>

          {/* TRUST BADGES */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              { icon: "⚡", text: "Fast Response" },
              { icon: "🔍", text: "Multiple Suppliers" },
              { icon: "💰", text: "Best Prices" },
              { icon: "🛡️", text: "Trusted Service" },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-gray-400"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span>{b.icon}</span>{b.text}
              </div>
            ))}
          </div>

          {/* REVIEWS SECTION */}
          {reviews.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-[13px] font-bold text-white">
                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                  </span>
                  <span className="text-[12px] text-gray-500">({reviews.length} reviews)</span>
                </div>
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
                {reviews.slice(0, 3).map((r, i) => (
                  <div key={i} className="rounded-2xl p-4 text-left" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} width="12" height="12" viewBox="0 0 24 24"
                          fill={s <= r.rating ? "#fbbf24" : "none"}
                          stroke={s <= r.rating ? "#fbbf24" : "rgba(255,255,255,0.15)"}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                    </div>
                    {r.comment && <p className="text-[13px] text-gray-300 leading-relaxed mb-3">"{r.comment}"</p>}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: "rgba(249,115,22,0.15)", color: "#fb923c" }}>
                        {(r.customer_name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold text-white">{r.customer_name}</div>
                        {r.part_sourced && <div className="text-[10px] text-gray-600">{r.part_sourced}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FORM CARD */}
          <div className="max-w-xl mx-auto">
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>

              {/* Step indicator */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {[1,2,3].map(s => (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 transition-all"
                        style={{ background: step >= s ? "linear-gradient(135deg,#f97316,#ea580c)" : "rgba(255,255,255,0.06)", color: step >= s ? "white" : "rgba(255,255,255,0.3)", boxShadow: step === s ? "0 0 12px rgba(249,115,22,0.4)" : "none" }}>
                        {step > s ? "✓" : s}
                      </div>
                      {s < 3 && <div className="flex-1 h-0.5 rounded-full" style={{ background: step > s ? "#f97316" : "rgba(255,255,255,0.08)" }} />}
                    </div>
                  ))}
                </div>
                <div className="text-[12px] text-gray-500">
                  {step === 1 ? "Your contact details" : step === 2 ? "Your vehicle info" : "What part do you need?"}
                </div>
              </div>

              <div className="px-6 pb-6 space-y-3">

                {/* STEP 1 - Contact */}
                {step === 1 && (
                  <>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                      <input name="customer_name" value={formData.customer_name} onChange={handleChange}
                        placeholder="e.g. John Smith" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">WhatsApp Number *</label>
                      <input name="phone_number" value={formData.phone_number} onChange={handleChange}
                        placeholder="e.g. 082 123 4567" type="tel" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Email (optional)</label>
                      <input name="email" value={formData.email} onChange={handleChange}
                        placeholder="your@email.com" type="email" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Your Area</label>
                      <input name="area" value={formData.area} onChange={handleChange}
                        placeholder="e.g. Bellville, Mitchells Plain" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">How did you hear about us?</label>
                      <select name="referral_source" value={formData.referral_source} onChange={handleChange}
                        className={inputCls} style={{ ...inputStyle, color: formData.referral_source ? "white" : "#6b7280" }}>
                        <option value="" style={{ background: "#1a1a1a" }}>Select an option</option>
                        {["WhatsApp","Facebook","Instagram","Google","Friend / Family","TikTok","Gumtree","Other"].map(o => (
                          <option key={o} value={o} style={{ background: "#1a1a1a" }}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* STEP 2 - Vehicle */}
                {step === 2 && (
                  <>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Vehicle Make *</label>
                      <select name="vehicle_make" value={formData.vehicle_make} onChange={handleChange}
                        className={inputCls} style={{ ...inputStyle, color: formData.vehicle_make ? "white" : "#6b7280" }}>
                        <option value="" style={{ background: "#1a1a1a" }}>Select make</option>
                        {VEHICLE_MAKES.map(m => <option key={m} value={m} style={{ background: "#1a1a1a" }}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Model *</label>
                      <input name="vehicle_model" value={formData.vehicle_model} onChange={handleChange}
                        placeholder="e.g. Golf 7, Polo Vivo, Hilux" className={inputCls} style={inputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Year</label>
                        <input name="vehicle_year" value={formData.vehicle_year} onChange={handleChange}
                          placeholder="e.g. 2018" className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Engine Size</label>
                        <input name="engine_size" value={formData.engine_size} onChange={handleChange}
                          placeholder="e.g. 1.4 TSI" className={inputCls} style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">VIN Number (optional)</label>
                      <input name="vin_number" value={formData.vin_number} onChange={handleChange}
                        placeholder="17-character VIN" className={inputCls} style={inputStyle} />
                    </div>
                  </>
                )}

                {/* STEP 3 - Part */}
                {step === 3 && (
                  <>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Part Needed *</label>
                      <input name="part_needed" value={formData.part_needed} onChange={handleChange}
                        placeholder="e.g. Front brake pads, alternator, gear lever" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Part Preference</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["New", "Aftermarket", "Any"].map(p => (
                          <button key={p} type="button" onClick={() => setFormData(f => ({ ...f, part_preference: p }))}
                            className="py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition"
                            style={formData.part_preference === p
                              ? { background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", border: "none" }
                              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Extra Details (optional)</label>
                      <textarea name="extra_details" value={formData.extra_details} onChange={handleChange}
                        placeholder="Any specific details, OEM number, condition notes..." rows={3}
                        className={inputCls} style={{ ...inputStyle, resize: "none" }} />
                    </div>

                    {/* Photo upload */}
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Photos (optional, max 5)</label>
                      {photos.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-2">
                          {photos.map((p, i) => (
                            <div key={i} className="relative">
                              <img src={URL.createObjectURL(p)} alt="" className="w-16 h-16 object-cover rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
                              <button type="button" onClick={() => removePhoto(i)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                                style={{ background: "#ef4444", color: "white", border: "none" }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {photos.length < 5 && (
                        <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl cursor-pointer transition text-[13px] text-gray-500"
                          style={{ border: "1.5px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          Add photo{photos.length > 0 ? "s" : ""} ({photos.length}/5)
                          <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                        </label>
                      )}
                    </div>
                  </>
                )}

                {/* Honeypot - hidden from real users */}
                <input
                  type="text"
                  name="website_url"
                  value={honeypot}
                  onChange={e => setHoneypot(e.target.value)}
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Navigation buttons */}
                <div className="flex gap-3 pt-2">
                  {step > 1 && (
                    <button type="button" onClick={() => setStep(s => s - 1)}
                      className="px-5 py-3 rounded-xl text-[14px] font-semibold cursor-pointer transition"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                      ← Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                      className="flex-1 py-3 rounded-xl text-[14px] font-bold cursor-pointer transition text-white"
                      style={{ background: canProceed() ? "linear-gradient(135deg,#f97316,#ea580c)" : "rgba(249,115,22,0.3)", border: "none", boxShadow: canProceed() ? "0 4px 20px rgba(249,115,22,0.3)" : "none" }}>
                      Continue →
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmit} disabled={loading || !canProceed()}
                      className="flex-1 py-3 rounded-xl text-[14px] font-bold cursor-pointer transition text-white"
                      style={{ background: loading ? "rgba(249,115,22,0.5)" : "linear-gradient(135deg,#f97316,#ea580c)", border: "none", boxShadow: "0 4px 20px rgba(249,115,22,0.3)" }}>
                      {loading ? (photos.length > 0 ? `Uploading ${photos.length} photo${photos.length > 1 ? "s" : ""}...` : "Submitting...") : "Submit Request 🔧"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { step: "1", title: "Submit", desc: "Tell us what part you need" },
                { step: "2", title: "We Search", desc: "We contact our suppliers" },
                { step: "3", title: "Get Quote", desc: "Receive price via WhatsApp" },
              ].map(s => (
                <div key={s.step} className="text-center p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black mx-auto mb-2" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}>{s.step}</div>
                  <div className="font-bold text-white text-[12px] mb-0.5">{s.title}</div>
                  <div className="text-gray-600 text-[11px]">{s.desc}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pb-8">
              <p className="text-gray-600 text-[12px]">Cape Town & surrounds · Free service · No obligation</p>
              <p className="text-gray-700 text-[11px] mt-1">
                <a href="/track" className="text-orange-500/60 no-underline hover:text-orange-400 transition">Track existing request</a>
                {" · "}
                <a href="/login" className="text-gray-700 no-underline hover:text-gray-500 transition">Admin</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING WHATSAPP BUTTON */}
      <a href={"https://wa.me/" + settings.whatsapp_number + "?text=Hi%20Cape%20Parts%20Finder%2C%20I%20need%20help%20finding%20a%20part"}
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-3 flex items-center justify-center sm:gap-2 rounded-full z-50 no-underline"
        style={{background:'linear-gradient(135deg,#25D366,#128C7E)',boxShadow:'0 8px 32px rgba(37,211,102,0.4)'}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
        <span className="font-bold text-white text-[13px] hidden sm:block">Chat with us</span>
      </a>
    </main>
  );
}
