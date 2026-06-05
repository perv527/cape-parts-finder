path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

# Find the reminder modal save button area and make it sticky
old_reminder = '''            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Set Callback Reminder</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{reminderModal.customer_name} · {reminderModal.phone_number}</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Date</label>
                <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Time</label>
                <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Note (optional)</label>
                <textarea value={reminderNote} onChange={e => setReminderNote(e.target.value)}
                  placeholder="e.g. Follow up on brake pad quote..." rows={2}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-gray-300 resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveReminder} disabled={savingReminder}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition text-white"
                  style={{ background: savingReminder ? "rgba(251,191,36,0.4)" : "linear-gradient(135deg,#f59e0b,#d97706)", border: "none" }}>
                  {savingReminder ? "Saving..." : "Set Reminder 🔔"}
                </button>
                <button onClick={() => setReminderModal(null)}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  Cancel
                </button>
              </div>
            </div>'''

new_reminder = '''            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-[15px] text-white">Set Callback Reminder</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{reminderModal.customer_name} · {reminderModal.phone_number}</p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Date *</label>
                <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-3 text-[14px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Time *</label>
                <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
                  className="w-full rounded-xl px-3 py-3 text-[14px] outline-none text-white"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Note (optional)</label>
                <textarea value={reminderNote} onChange={e => setReminderNote(e.target.value)}
                  placeholder="e.g. Follow up on brake pad quote..." rows={2}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-gray-300 resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              {reminderDate && reminderTime && (
                <div className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
                  <p className="text-[12px]" style={{ color: "#fbbf24" }}>
                    Reminder set for {new Date(reminderDate + "T" + reminderTime).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })} at {reminderTime}
                  </p>
                </div>
              )}
            </div>
            <div className="p-5 flex gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", position: "sticky", bottom: 0, background: "#1a1a1a" }}>
              <button onClick={saveReminder} disabled={savingReminder}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold cursor-pointer transition text-white"
                style={{ background: savingReminder ? "rgba(251,191,36,0.4)" : "linear-gradient(135deg,#f59e0b,#d97706)", border: "none" }}>
                {savingReminder ? "Saving..." : "Save Reminder"}
              </button>
              <button onClick={() => setReminderModal(null)}
                className="px-5 py-3 rounded-xl text-[14px] font-medium cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
            </div>'''

if old_reminder in c:
    c = c.replace(old_reminder, new_reminder, 1)
    print("Replaced reminder modal!")
else:
    print("ERROR: Could not find reminder modal content")

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has sticky bottom:", "sticky" in c)
