path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add editModal state
old_state = '  const [reviewModal, setReviewModal] = useState<any>(null);'
new_state = '''  const [reviewModal, setReviewModal] = useState<any>(null);
  const [editModal, setEditModal] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);'''
c = c.replace(old_state, new_state, 1)

# 2. Add saveEdit function before NAV_LINKS
old_nav = '  const NAV_LINKS = ['
new_nav = '''  async function saveEdit() {
    if (!editModal) return;
    setSavingEdit(true);
    await supabase.from("parts_requests").update({
      customer_name: editForm.customer_name,
      phone_number: editForm.phone_number,
      email: editForm.email,
      area: editForm.area,
      vehicle_make: editForm.vehicle_make,
      vehicle_model: editForm.vehicle_model,
      vehicle_year: editForm.vehicle_year,
      engine_size: editForm.engine_size,
      part_needed: editForm.part_needed,
      extra_details: editForm.extra_details,
    }).eq("id", editModal.id);
    setSavingEdit(false);
    setEditModal(null);
    fetchRequests();
  }

  const NAV_LINKS = ['''
c = c.replace(old_nav, new_nav, 1)

# 3. Add Edit button in the expanded request card actions area
old_actions = '''                        <button onClick={() => router.push(`/suppliers?requestId=${request.id}&part=${encodeURIComponent(request.part_needed||"")}&make=${encodeURIComponent(request.vehicle_make||"")}&model=${encodeURIComponent(request.vehicle_model||"")}&year=${encodeURIComponent(request.vehicle_year||"")}&photo=${encodeURIComponent(request.photo_url||"")}&vin=${encodeURIComponent(request.vin_number||"")}`)}'''
new_actions = '''                        <button onClick={() => { setEditModal(request); setEditForm({ customer_name: request.customer_name || "", phone_number: request.phone_number || "", email: request.email || "", area: request.area || "", vehicle_make: request.vehicle_make || "", vehicle_model: request.vehicle_model || "", vehicle_year: request.vehicle_year || "", engine_size: request.engine_size || "", part_needed: request.part_needed || "", extra_details: request.extra_details || "" }); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition"
                          style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: "#60a5fa" }}>
                          Edit Request
                        </button>
                        <button onClick={() => router.push(`/suppliers?requestId=${request.id}&part=${encodeURIComponent(request.part_needed||"")}&make=${encodeURIComponent(request.vehicle_make||"")}&model=${encodeURIComponent(request.vehicle_model||"")}&year=${encodeURIComponent(request.vehicle_year||"")}&photo=${encodeURIComponent(request.photo_url||"")}&vin=${encodeURIComponent(request.vin_number||"")}`)}'''
c = c.replace(old_actions, new_actions, 1)

# 4. Add edit modal before closing main
old_closing = '\n    </main>\n  );\n}'
new_closing = '''
      {/* EDIT REQUEST MODAL */}
      {editModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setEditModal(null); }}>
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Edit Request</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Fix any details on this request</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Customer Name", key: "customer_name" },
                  { label: "Phone Number", key: "phone_number" },
                  { label: "Email", key: "email" },
                  { label: "Area", key: "area" },
                  { label: "Vehicle Make", key: "vehicle_make" },
                  { label: "Vehicle Model", key: "vehicle_model" },
                  { label: "Vehicle Year", key: "vehicle_year" },
                  { label: "Engine Size", key: "engine_size" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] text-gray-500 mb-1 block">{f.label}</label>
                    <input value={editForm[f.key] || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Part Needed</label>
                <input value={editForm.part_needed || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, part_needed: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Extra Details</label>
                <textarea value={editForm.extra_details || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, extra_details: e.target.value }))}
                  rows={2} className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-2 pt-2" style={{ position: "sticky", bottom: 0, background: "#1a1a1a", paddingTop: 12 }}>
                <button onClick={saveEdit} disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: savingEdit ? "rgba(96,165,250,0.4)" : "linear-gradient(135deg,#3b82f6,#2563eb)", border: "none" }}>
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => setEditModal(null)}
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
}'''
c = c.replace(old_closing, new_closing, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has editModal:", "editModal" in c)
print("has saveEdit:", "saveEdit" in c)
print("has Edit Request button:", "Edit Request" in c)
