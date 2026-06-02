import re

path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add reminder state variables after existing state
old_state = '  const [newCount, setNewCount] = useState(0);'
new_state = '''  const [newCount, setNewCount] = useState(0);
  const [reminderModal, setReminderModal] = useState<any>(null);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderDueCount, setReminderDueCount] = useState(0);'''
c = c.replace(old_state, new_state, 1)

# 2. Add fetchReminderCount inside fetchRequests (after setNewCount)
old_fetch = '    setNewCount((data || []).filter((r: any) => r.status === "New").length);'
new_fetch = '''    setNewCount((data || []).filter((r: any) => r.status === "New").length);
    // fetch due reminders count
    const { data: rem } = await supabase.from("reminders").select("id").eq("completed", false).lte("remind_at", new Date().toISOString());
    setReminderDueCount((rem || []).length);'''
c = c.replace(old_fetch, new_fetch, 1)

# 3. Add saveReminder function before the return statement
old_return = '  return (\n    <main'
new_return = '''  async function saveReminder() {
    if (!reminderDate || !reminderTime) { alert("Pick a date and time"); return; }
    setSavingReminder(true);
    const remind_at = new Date(reminderDate + "T" + reminderTime).toISOString();
    await supabase.from("reminders").insert([{
      request_id: reminderModal.id,
      customer_name: reminderModal.customer_name,
      phone_number: reminderModal.phone_number,
      note: reminderNote,
      remind_at,
    }]);
    setSavingReminder(false);
    setReminderModal(null);
    setReminderDate("");
    setReminderTime("");
    setReminderNote("");
    alert("Reminder set for " + reminderModal.customer_name + "!");
  }

  return (
    <main'''
c = c.replace(old_return, new_return, 1)

# 4. Add Reminders nav link - after Analytics
c = c.replace(
    '{ label: "Analytics", href: "/analytics" }].map',
    '{ label: "Analytics", href: "/analytics" }, { label: "Reminders", href: "/reminders" }].map',
    1
)

# 5. Add bell button inside each request card - after the expand chevron button area
# Find the status pill span closing and add bell after it
old_bell_area = '                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"\n                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>\n                        <polyline points="6 9 12 15 18 9"/>\n                      </svg>'
new_bell_area = '''                      <button onClick={(e) => { e.stopPropagation(); setReminderModal(request); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition flex-shrink-0"
                        style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}
                        title="Set reminder">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      </button>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>'''
c = c.replace(old_bell_area, new_bell_area, 1)

# 6. Add reminder badge to Reminders nav link
c = c.replace(
    '{ label: "Reminders", href: "/reminders" }].map',
    '{ label: "Reminders", href: "/reminders", badge: reminderDueCount }].map',
    1
)

# 7. Update nav render to show badge
old_nav_render = '                  {n.label}{n.href === "/admin" && newCount > 0 && (<span style={{ marginLeft: 6, background: "#f97316", color: "white", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 6px", lineHeight: "16px", display: "inline-block" }}>{newCount}</span>)}'
new_nav_render = '''                  {n.label}{n.href === "/admin" && newCount > 0 && (<span style={{ marginLeft: 6, background: "#f97316", color: "white", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 6px", lineHeight: "16px", display: "inline-block" }}>{newCount}</span>)}{n.badge && n.badge > 0 ? (<span style={{ marginLeft: 6, background: "#fbbf24", color: "#0a0a0a", borderRadius: 999, fontSize: 10, fontWeight: 700, padding: "1px 6px", lineHeight: "16px", display: "inline-block" }}>{n.badge}</span>) : null}'''
c = c.replace(old_nav_render, new_nav_render, 1)

# 8. Add reminder modal before the closing </main>
old_closing = '    </main>\n  );\n}'
new_closing = '''      {/* REMINDER MODAL */}
      {reminderModal && (
        <div className="fixed inset-0 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setReminderModal(null); }}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
                  placeholder="e.g. Follow up on brake pad quote..."
                  rows={2} className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-gray-300 resize-none"
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
print("has reminderModal:", "reminderModal" in c)
print("has saveReminder:", "saveReminder" in c)
print("has bell button:", "Set reminder" in c)
print("has Reminders nav:", '"/reminders"' in c)
