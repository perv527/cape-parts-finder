path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add reviewModal state
old_state = '  const [reminderDueCount, setReminderDueCount] = useState(0);'
new_state = '''  const [reminderDueCount, setReminderDueCount] = useState(0);
  const [reviewModal, setReviewModal] = useState<any>(null);'''
c = c.replace(old_state, new_state, 1)

# 2. Trigger review modal after Delivered status update
old_notify = '''    if (request && getStatusMessage(request, status)) {
      setNotifyModal({ request: { ...request, status }, status });
    }'''
new_notify = '''    if (request && getStatusMessage(request, status)) {
      setNotifyModal({ request: { ...request, status }, status });
    }
    if (status === "Delivered") {
      setTimeout(() => setReviewModal(request), 800);
    }'''
c = c.replace(old_notify, new_notify, 1)

# 3. Add review modal before closing </main>
old_closing = '\n    </main>\n  );\n}'
new_closing = '''
      {/* REVIEW REQUEST MODAL */}
      {reviewModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setReviewModal(null); }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-2xl mb-1">⭐</div>
              <h2 className="font-bold text-[15px] text-white">Request a Review</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{reviewModal.customer_name} just received their part — ask for a review!</p>
            </div>
            <div className="p-5">
              <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[12px] text-gray-300 leading-relaxed">
                  Hi {reviewModal.customer_name}, thank you for your order! We hope your {reviewModal.part_needed} is exactly what you needed. We would really appreciate if you could leave us a quick review: cape-parts-finder.vercel.app/review - It only takes 30 seconds! Cape Parts Finder
                </p>
              </div>
              <div className="flex gap-2">
                <a href={"https://wa.me/" + (reviewModal.phone_number || "").replace(/\D/g, "") + "?text=" + encodeURIComponent("Hi " + (reviewModal.customer_name || "there") + ", thank you for your order! We hope your " + (reviewModal.part_needed || "part") + " is exactly what you needed. We would really appreciate if you could leave us a quick review: cape-parts-finder.vercel.app/review - It only takes 30 seconds! Cape Parts Finder")}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setReviewModal(null)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold no-underline text-white"
                  style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  Send on WhatsApp
                </a>
                <button onClick={() => setReviewModal(null)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}'''
c = c.replace(old_closing, new_closing, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has reviewModal:", "reviewModal" in c)
print("has review prompt:", "Request a Review" in c)
