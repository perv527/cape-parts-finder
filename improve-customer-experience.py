import base64

# Read current page
path = "frontend/app/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add auto WhatsApp notification on submit success
old_success = '      setSuccess(true);\n    } catch (err) { alert("Something went wrong. Please try again."); }\n    setLoading(false);\n  }'
new_success = '''      setSuccess(true);

      // Auto notify yourself via WhatsApp
      const waMsg = "New Part Request!" +
        "\\nName: " + formData.customer_name +
        "\\nPhone: " + formData.phone_number +
        "\\nVehicle: " + formData.vehicle_year + " " + formData.vehicle_make + " " + formData.vehicle_model +
        "\\nPart: " + formData.part_needed +
        "\\nPreference: " + formData.part_preference +
        (formData.area ? "\\nArea: " + formData.area : "") +
        (formData.referral_source ? "\\nFrom: " + formData.referral_source : "");
      const waUrl = "https://wa.me/" + settings.whatsapp_number + "?text=" + encodeURIComponent(waMsg);
      window.open(waUrl, "_blank");

    } catch (err) { alert("Something went wrong. Please try again."); }
    setLoading(false);
  }'''
c = c.replace(old_success, new_success, 1)

# 2. Improve success page with ETA and better info
old_success_page = '''        <h2 className="text-[28px] font-black text-white mb-3">Request Sent!</h2>
        <p className="text-gray-400 text-[15px] leading-relaxed mb-6">We received your request for a <span style={{ color: "#fb923c" }}>{formData.part_needed}</span>. We'll search our supplier network and contact you shortly on <span style={{ color: "#fb923c" }}>{formData.phone_number}</span>.</p>
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[12px] text-gray-500 mb-2">Track your request status</p>
          <a href="/track" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[14px] font-bold text-white no-underline"
            style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
            Track My Request →
          </a>
        </div>'''

new_success_page = '''        <h2 className="text-[28px] font-black text-white mb-3">Request Sent!</h2>
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
        </div>'''

c = c.replace(old_success_page, new_success_page, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done page.tsx!")
print("has auto WhatsApp:", "Auto notify" in c)
print("has ETA:", "response time" in c)
print("has cancel mention:", "cancel" in c)

# Now update track page to add cancel functionality
track_path = "frontend/app/track/page.tsx"
t = open(track_path, encoding="utf-8").read()

# Add cancel function and button
old_track_contact = '  return ('
new_track_contact = '''  const [cancelling, setCancelling] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  async function cancelRequest() {
    if (!request) return;
    const canCancel = ["New", "Searching"].includes(request.status || "New");
    if (!canCancel) {
      alert("This request cannot be cancelled as it has already been quoted or ordered.");
      return;
    }
    if (!confirm("Are you sure you want to cancel this request for " + request.part_needed + "?")) return;
    setCancelling(true);
    await supabase.from("parts_requests").update({ status: "Closed" }).eq("id", request.id);
    setCancelling(false);
    setCancelDone(true);
    setRequest({ ...request, status: "Closed" });
  }

  return ('''
t = t.replace(old_track_contact, new_track_contact, 1)

# Add cancel button near the WhatsApp contact button
old_wa_btn = 'style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>'
new_wa_btn = '''style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>'''

# Find the contact section and add cancel button
old_contact = 'href={"https://wa.me/" + settings.whatsapp_number'
i = t.find(old_contact)
if i > 0:
    # Find the end of that link element
    end = t.find('</a>', i) + 4
    cancel_btn = '''
            {request && ["New", "Searching"].includes(request.status || "New") && !cancelDone && (
              <button onClick={cancelRequest} disabled={cancelling}
                className="w-full py-3 rounded-xl text-[13px] font-semibold cursor-pointer transition mt-2"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {cancelling ? "Cancelling..." : "Cancel Request"}
              </button>
            )}
            {cancelDone && (
              <div className="w-full py-3 rounded-xl text-[13px] text-center mt-2" style={{ background: "rgba(107,114,128,0.1)", color: "#9ca3af" }}>
                Request cancelled
              </div>
            )}'''
    t = t[:end] + cancel_btn + t[end:]
    print("Added cancel button to track page!")

open(track_path, "w", encoding="utf-8").write(t)
print("Done track.tsx!")
print("has cancelRequest:", "cancelRequest" in t)
