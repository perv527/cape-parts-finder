path = "frontend/app/settings/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add backup state
old_state = '  const [saving, setSaving] = useState(false);'
new_state = '''  const [saving, setSaving] = useState(false);
  const [backing, setBacking] = useState(false);'''
c = c.replace(old_state, new_state, 1)

# 2. Add backup function before saveSettings
old_save = '  async function saveSettings() {'
new_save = '''  async function exportAllData() {
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

  async function saveSettings() {'''
c = c.replace(old_save, new_save, 1)

# 3. Add backup section before the save button at the bottom
old_save_btn = '''        <button onClick={saveSettings} disabled={saving}
          className="w-full py-3.5 rounded-2xl text-[15px] font-bold cursor-pointer transition text-white"'''
new_save_btn = '''        {/* BACKUP SECTION */}
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
          className="w-full py-3.5 rounded-2xl text-[15px] font-bold cursor-pointer transition text-white"'''
c = c.replace(old_save_btn, new_save_btn, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has exportAllData:", "exportAllData" in c)
print("has backing:", "backing" in c)
print("has Download Full Backup:", "Download Full Backup" in c)
