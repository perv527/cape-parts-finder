path = "frontend/app/analytics/page.tsx"
c = open(path, encoding="utf-8").read()

# Add new analytics functions before statusColors
old_colors = '  const statusColors: Record<string, string> = {'

new_section = '''  // Best selling parts (from sales)
  function getBestSellingParts() {
    const counts: Record<string, { count: number; revenue: number }> = {};
    sales.forEach(s => {
      const part = (s.part_needed || s.part || "Unknown").toLowerCase().trim();
      if (!counts[part]) counts[part] = { count: 0, revenue: 0 };
      counts[part].count += 1;
      counts[part].revenue += Number(s.selling_price || 0);
    });
    return Object.entries(counts).sort((a, b) => b[1].count - a[1].count).slice(0, 6)
      .map(([part, data]) => ({ part, ...data }));
  }

  // Best day of week
  function getBestDays() {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array(7).fill(0);
    requests.forEach(r => { counts[new Date(r.created_at).getDay()] += 1; });
    return days.map((day, i) => ({ day, count: counts[i] }));
  }

  // Peak hours
  function getPeakHours() {
    const counts = Array(24).fill(0);
    requests.forEach(r => { counts[new Date(r.created_at).getHours()] += 1; });
    return counts.map((count, hour) => ({
      hour: hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour-12}pm`,
      count
    })).filter(h => h.count > 0);
  }

  // Monthly trend (last 6 months)
  function getMonthlyTrend() {
    const months: Record<string, { requests: number; sales: number; revenue: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
      months[key] = { requests: 0, sales: 0, revenue: 0 };
    }
    requests.forEach(r => {
      const d = new Date(r.created_at);
      const key = d.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
      if (months[key]) months[key].requests += 1;
    });
    sales.forEach(s => {
      const d = new Date(s.created_at);
      const key = d.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
      if (months[key]) { months[key].sales += 1; months[key].revenue += Number(s.selling_price || 0); }
    });
    return Object.entries(months).map(([month, data]) => ({ month, ...data }));
  }

  const bestParts = getBestSellingParts();
  const bestDays = getBestDays();
  const peakHours = getPeakHours();
  const monthlyTrend = getMonthlyTrend();
  const maxDayCount = Math.max(...bestDays.map(d => d.count), 1);
  const maxHourCount = Math.max(...peakHours.map(h => h.count), 1);
  const maxMonthRequests = Math.max(...monthlyTrend.map(m => m.requests), 1);
  const avgSaleValue = sales.length > 0 ? sales.reduce((s, x) => s + Number(x.selling_price || 0), 0) / sales.length : 0;
  const bestDay = bestDays.reduce((a, b) => a.count > b.count ? a : b, bestDays[0]);
  const peakHour = peakHours.reduce((a, b) => a.count > b.count ? a : b, peakHours[0]);

  const statusColors: Record<string, string> = {'''

c = c.replace(old_colors, new_section, 1)

# Add new sections before the SUMMARY ROW
old_summary = '          {/* SUMMARY ROW */}'
new_analytics = '''          {/* BEST SELLING PARTS */}
          {bestParts.length > 0 && (
            <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
              <h2 className="font-bold text-[14px] text-white mb-4">Best Selling Parts</h2>
              <div className="space-y-2.5">
                {bestParts.map(({ part, count, revenue }, i) => (
                  <div key={part}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-600">#{i+1}</span>
                        <span className="text-[12px] text-gray-300 font-medium capitalize">{part}</span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-[11px] text-gray-500">{count} sold</span>
                        <span className="text-[12px] font-bold" style={{ color: "#4ade80" }}>R{revenue.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(count / bestParts[0].count) * 100}%`, background: "linear-gradient(90deg,#f97316,#fb923c)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BEST DAY + PEAK HOUR + AVG SALE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            <div className="rounded-2xl p-5" style={cardStyle}>
              <h2 className="font-bold text-[14px] text-white mb-1">Busiest Day</h2>
              <p className="text-[11px] text-gray-600 mb-4">Requests by day of week</p>
              <div className="flex items-end gap-1 h-24">
                {bestDays.map(d => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm transition-all"
                      style={{ height: `${maxDayCount > 0 ? (d.count / maxDayCount) * 80 : 0}px`, background: bestDay && d.day === bestDay.day ? "#f97316" : "rgba(249,115,22,0.3)", minHeight: d.count > 0 ? 4 : 0 }} />
                    <span className="text-[9px] text-gray-600">{d.day}</span>
                  </div>
                ))}
              </div>
              {bestDay && bestDay.count > 0 && <p className="text-[11px] mt-2" style={{ color: "#fb923c" }}>{bestDay.day} is your busiest day</p>}
            </div>

            <div className="rounded-2xl p-5" style={cardStyle}>
              <h2 className="font-bold text-[14px] text-white mb-1">Peak Hours</h2>
              <p className="text-[11px] text-gray-600 mb-4">When customers submit requests</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {peakHours.sort((a,b) => b.count - a.count).slice(0,6).map(h => (
                  <div key={h.hour} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-8 flex-shrink-0">{h.hour}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(h.count / maxHourCount) * 100}%`, background: "rgba(96,165,250,0.7)" }} />
                    </div>
                    <span className="text-[10px] text-gray-500 w-4">{h.count}</span>
                  </div>
                ))}
              </div>
              {peakHour && <p className="text-[11px] mt-2" style={{ color: "#60a5fa" }}>{peakHour.hour} is your peak hour</p>}
            </div>

            <div className="rounded-2xl p-5" style={cardStyle}>
              <h2 className="font-bold text-[14px] text-white mb-1">Key Metrics</h2>
              <p className="text-[11px] text-gray-600 mb-4">All-time averages</p>
              <div className="space-y-3">
                {[
                  { label: "Avg Sale Value", value: `R${avgSaleValue.toFixed(0)}`, color: "#4ade80" },
                  { label: "Avg Profit/Sale", value: sales.length > 0 ? `R${(sales.reduce((s,x) => s+Number(x.profit||0),0)/sales.length).toFixed(0)}` : "—", color: "#60a5fa" },
                  { label: "Conversion Rate", value: `${conversionRate}%`, color: "#fb923c" },
                  { label: "Total Revenue", value: `R${sales.reduce((s,x) => s+Number(x.selling_price||0),0).toFixed(0)}`, color: "#c084fc" },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">{m.label}</span>
                    <span className="font-bold text-[14px]" style={{ color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MONTHLY TREND */}
          <div className="rounded-2xl p-5 mb-5" style={cardStyle}>
            <h2 className="font-bold text-[14px] text-white mb-1">Monthly Trend</h2>
            <p className="text-[11px] text-gray-600 mb-4">Last 6 months — requests vs sales</p>
            <div className="flex items-end gap-3 h-36">
              {monthlyTrend.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-0.5 h-28">
                    <div className="flex-1 rounded-t-md" style={{ height: `${maxMonthRequests > 0 ? (m.requests / maxMonthRequests) * 100 : 0}%`, background: "rgba(249,115,22,0.4)", minHeight: m.requests > 0 ? 4 : 0 }} />
                    <div className="flex-1 rounded-t-md" style={{ height: `${maxMonthRequests > 0 ? (m.sales / maxMonthRequests) * 100 : 0}%`, background: "rgba(34,197,94,0.6)", minHeight: m.sales > 0 ? 4 : 0 }} />
                  </div>
                  <span className="text-[9px] text-gray-600">{m.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px]">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "rgba(249,115,22,0.6)" }} />Requests</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "rgba(34,197,94,0.6)" }} />Sales</div>
            </div>
          </div>

          {/* SUMMARY ROW */}'''

c = c.replace(old_summary, new_analytics, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has bestParts:", "bestParts" in c)
print("has monthlyTrend:", "monthlyTrend" in c)
print("has peakHours:", "peakHours" in c)
