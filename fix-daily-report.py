path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

# Find and replace the entire broken sendDailyReport function
import re

old_func_start = '  async function sendDailyReport() {'
old_func_end = '  const NAV_LINKS = ['

start_idx = c.find(old_func_start)
end_idx = c.find(old_func_end)

if start_idx == -1 or end_idx == -1:
    print("ERROR: Could not find function boundaries")
    print("start:", start_idx, "end:", end_idx)
else:
    new_func = '''  async function sendDailyReport() {
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const n = "\\n";

    const { data: todaySales } = await supabase.from("sales").select("*")
      .gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString());
    const revenue = (todaySales || []).reduce((s: number, x: any) => s + Number(x.selling_price || 0), 0);
    const profit = (todaySales || []).reduce((s: number, x: any) => s + Number(x.profit || 0), 0);

    const { data: monthExp } = await supabase.from("expenses").select("amount")
      .gte("date", new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
    const expTotal = (monthExp || []).reduce((s: number, e: any) => s + Number(e.amount), 0);

    const { data: dueRem } = await supabase.from("reminders").select("customer_name, note")
      .eq("completed", false).lte("remind_at", now.toISOString()).limit(5);

    const todayReqs = requests.filter((r: any) => {
      const d = new Date(r.created_at);
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const stale = requests.filter((r: any) => {
      const isClosed = r.status === "Closed" || r.status === "Delivered";
      return !isClosed && (Date.now() - new Date(r.updated_at || r.created_at).getTime()) > 3 * 24 * 60 * 60 * 1000;
    });

    const pending = requests.filter((r: any) => !r.status || r.status === "New" || r.status === "Searching");

    let msg = "";
    msg += "Cape Parts Finder - Daily Report" + n;
    msg += todayStr + n + n;
    msg += "TODAY" + n;
    msg += "New requests: " + todayReqs.length + n;
    msg += "Sales closed: " + (todaySales || []).length + n;
    msg += "Revenue: R" + revenue.toFixed(0) + n;
    msg += "Profit: R" + profit.toFixed(0) + n + n;
    msg += "PIPELINE" + n;
    msg += "Active requests: " + requests.filter((r: any) => r.status !== "Closed").length + n;
    msg += "Pending: " + pending.length + n;
    msg += "Quoted: " + counts.Quoted + n;
    msg += "Ordered: " + counts.Ordered + n + n;

    if (stale.length > 0) {
      msg += "FOLLOW-UPS NEEDED (" + stale.length + ")" + n;
      stale.slice(0, 3).forEach((r: any) => { msg += "- " + r.customer_name + " / " + r.part_needed + n; });
      if (stale.length > 3) msg += "...and " + (stale.length - 3) + " more" + n;
      msg += n;
    }

    if ((dueRem || []).length > 0) {
      msg += "REMINDERS DUE (" + (dueRem || []).length + ")" + n;
      (dueRem || []).forEach((r: any) => { msg += "- " + r.customer_name + (r.note ? " / " + r.note : "") + n; });
      msg += n;
    }

    msg += "THIS MONTH EXPENSES" + n;
    msg += "Total spent: R" + expTotal.toFixed(0) + n + n;
    msg += "---" + n;
    msg += "Cape Parts Finder";

    const phone = "27696863952";
    window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(msg));
  }

  '''

    c = c[:start_idx] + new_func + c[end_idx:]
    open(path, "w", encoding="utf-8").write(c)
    print("Done!")
    print("has sendDailyReport:", "sendDailyReport" in c)
    print("has broken newline:", '"Cape Parts Finder — Daily Report*\n"' in c)
