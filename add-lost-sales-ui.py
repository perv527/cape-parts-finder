path = "frontend/app/analytics/page.tsx"
c = open(path, encoding="utf-8").read()

# Find the exact closing
old_closing = '    </main>\n  );\n}'
new_section = '''    {/* LOST SALES ANALYSIS */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 32px" }}>
        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="font-bold text-[16px] text-white mb-1">Lost Sales Analysis</h2>
          <p className="text-[12px] text-gray-500 mb-4">Why quotes were rejected and revenue lost</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total Quotes", value: allQuotes.length, color: "#60a5fa" },
              { label: "Rejected", value: rejectedQuotes.length, color: "#f87171" },
              { label: "Loss Rate", value: allQuotes.length > 0 ? (rejectedQuotes.length / allQuotes.length * 100).toFixed(0) + "%" : "0%", color: "#fb923c" },
              { label: "Revenue Lost", value: "R" + rejectedQuotes.reduce((sum: number, q: any) => sum + Number(q.marked_up_price || 0), 0).toFixed(0), color: "#f87171" },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{stat.label}</p>
                <p className="text-[22px] font-black" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
          {rejectedQuotes.length === 0 ? (
            <p className="text-center text-gray-600 text-[13px] py-6">No rejected quotes yet — keep it up!</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">Rejection Reasons</p>
                {(() => {
                  const reasons: Record<string, number> = {};
                  rejectedQuotes.forEach((q: any) => {
                    const note = q.notes || "";
                    const match = note.match(/REJECTED: (.+)/);
                    const reason = match ? match[1].split(" | ")[0].trim().slice(0, 30) : "No reason given";
                    reasons[reason] = (reasons[reason] || 0) + 1;
                  });
                  const total = rejectedQuotes.length;
                  return Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                    <div key={reason} className="mb-3">
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-gray-300">{reason}</span>
                        <span className="text-gray-500">{count} ({Math.round(count / total * 100)}%)</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-2 rounded-full transition-all" style={{ width: `${count / total * 100}%`, background: "rgba(248,113,113,0.6)" }} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">Supplier Rejection Rate</p>
                <div className="space-y-2">
                  {(() => {
                    const supStats: Record<string, { rejected: number, total: number, name: string }> = {};
                    allQuotes.forEach((q: any) => {
                      const id = String(q.supplier_id);
                      const name = (q.suppliers as any)?.name || suppliers.find((s: any) => s.id === q.supplier_id)?.name || "Unknown";
                      if (!supStats[id]) supStats[id] = { rejected: 0, total: 0, name };
                      supStats[id].total++;
                      if (q.rejected) supStats[id].rejected++;
                    });
                    return Object.values(supStats).filter((s: any) => s.total > 0)
                      .sort((a: any, b: any) => (b.rejected / b.total) - (a.rejected / a.total))
                      .slice(0, 6).map((s: any) => (
                        <div key={s.name} className="flex justify-between items-center rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <span className="text-[13px] text-gray-300">{s.name}</span>
                          <span className="text-[12px] font-semibold" style={{ color: s.rejected / s.total > 0.3 ? "#f87171" : "#4ade80" }}>
                            {s.rejected}/{s.total} ({Math.round(s.rejected / s.total * 100)}%)
                          </span>
                        </div>
                      ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}'''

if old_closing in c:
    c = c.replace(old_closing, new_section, 1)
    print("Added lost sales UI!")
else:
    print("Closing not found")
    print("Last 100 chars:", repr(c[-100:]))

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has Lost Sales:", "Lost Sales" in c)
