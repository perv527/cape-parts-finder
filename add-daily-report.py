path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add daily report function before the return statement
old_return = '  const NAV_LINKS = ['
new_return = '''  async function sendDailyReport() {
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    // Get today sales
    const { data: todaySales } = await supabase.from("sales").select("*")
      .gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString());
    const revenue = (todaySales || []).reduce((s: number, x: any) => s + Number(x.selling_price || 0), 0);
    const profit = (todaySales || []).reduce((s: number, x: any) => s + Number(x.profit || 0), 0);

    // Get month expenses
    const { data: monthExp } = await supabase.from("expenses").select("amount")
      .gte("date", new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
    const expenses = (monthExp || []).reduce((s: number, e: any) => s + Number(e.amount), 0);

    // Get due reminders
    const { data: dueRem } = await supabase.from("reminders").select("customer_name, note")
      .eq("completed", false).lte("remind_at", now.toISOString()).limit(5);

    // Today requests
    const todayReqs = requests.filter(r => {
      const d = new Date(r.created_at);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    // Stale requests
    const stale = requests.filter(r => {
      const isClosed = r.status === "Closed" || r.status === "Delivered";
      return !isClosed && (Date.now() - new Date(r.updated_at || r.created_at).getTime()) > 3 * 24 * 60 * 60 * 1000;
    });

    // Pending (New + Searching)
    const pending = requests.filter(r => !r.status || r.status === "New" || r.status === "Searching");

    let msg = "🔧 *Cape Parts Finder — Daily Report*\n";
    msg += `📅 ${todayStr}\n\n`;

    msg += "📊 *Today's Performance*\n";
    msg += `• New requests: ${todayReqs.length}\n`;
    msg += `• Sales closed: ${(todaySales || []).length}\n`;
    msg += `• Revenue: R${revenue.toFixed(0)}\n`;
    msg += `• Profit: R${profit.toFixed(0)}\n\n`;

    msg += "📋 *Pipeline*\n";
    msg += `• Total active requests: ${requests.filter(r => r.status !== "Closed").length}\n`;
    msg += `• Pending (New/Searching): ${pending.length}\n`;
    msg += `• Quoted: ${counts.Quoted}\n`;
    msg += `• Ordered: ${counts.Ordered}\n\n`;

    if (stale.length > 0) {
      msg += `⏰ *Follow-ups Needed (${stale.length})*\n`;
      stale.slice(0, 3).forEach((r: any) => {
        msg += `• ${r.customer_name} — ${r.part_needed}\n`;
      });
      if (stale.length > 3) msg += `• ...and ${stale.length - 3} more\n`;
      msg += "\n";
    }

    if ((dueRem || []).length > 0) {
      msg += `🔔 *Reminders Due (${(dueRem || []).length})*\n`;
      (dueRem || []).forEach((r: any) => {
        msg += `• ${r.customer_name}${r.note ? " — " + r.note : ""}\n`;
      });
      msg += "\n";
    }

    msg += "💸 *This Month Expenses*\n";
    msg += `• Total spent: R${expenses.toFixed(0)}\n\n`;

    msg += "━━━━━━━━━━━━━━\n";
    msg += "Cape Parts Finder 🔧";

    const phone = "27696863952"; // your number - update this
    window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(msg));
  }

  const NAV_LINKS = ['''
c = c.replace(old_return, new_return, 1)

# 2. Add the report button next to the refresh button in nav
old_btn = '''              <button onClick={fetchRequests}
                className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>'''
new_btn = '''              <button onClick={fetchRequests}
                className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
              <button onClick={sendDailyReport}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition"
                style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)", color: "#25D366" }}
                title="Send daily report to WhatsApp">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Report
              </button>'''
c = c.replace(old_btn, new_btn, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has sendDailyReport:", "sendDailyReport" in c)
print("has Report button:", "Report" in c)
