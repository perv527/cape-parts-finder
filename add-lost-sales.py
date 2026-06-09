path = "frontend/app/analytics/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add rejected quotes state
old_state = '  const [targets, setTargets] = useState<any>(null);'
new_state = '''  const [targets, setTargets] = useState<any>(null);
  const [rejectedQuotes, setRejectedQuotes] = useState<any[]>([]);
  const [allQuotes, setAllQuotes] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);'''
c = c.replace(old_state, new_state, 1)

# 2. Add rejected quotes to fetch
old_fetch = '''        supabase.from("targets").select("*").eq("month", monthKey).maybeSingle(),
      ]).then(([{ data: s }, { data: r }, { data: e }, { data: t }]) => {
        setSales(s || []);
        setRequests(r || []);'''
new_fetch = '''        supabase.from("targets").select("*").eq("month", monthKey).maybeSingle(),
        supabase.from("supplier_quotes").select("*, suppliers(name)").order("created_at", { ascending: false }),
        supabase.from("suppliers").select("*").order("name"),
      ]).then(([{ data: s }, { data: r }, { data: e }, { data: t }, { data: q }, { data: sup }]) => {
        setSales(s || []);
        setRequests(r || []);
        setRejectedQuotes((q || []).filter((q: any) => q.rejected));
        setAllQuotes(q || []);
        setSuppliers(sup || []);'''
c = c.replace(old_fetch, new_fetch, 1)

# 3. Add lost sales section before the closing of the main content
# Find a good insertion point - after the best parts section
old_closing = '      </div>\n    </main>\n  );\n}'
new_closing = '''      {/* LOST SALES ANALYSIS */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="font-bold text-[16px] text-white mb-1">Lost Sales Analysis</h2>
        <p className="text-[12px] text-gray-500 mb-4">Why quotes were rejected and what it cost you</p>

        {/* Summary stats */}
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
          <div className="text-center py-8">
            <p className="text-gray-600 text-[13px]">No rejected quotes yet</p>
          </div>
        ) : (
          <>
            {/* Rejection reasons breakdown */}
            <div className="mb-5">
              <p className="text-[12px] font-semibold text-gray-400 mb-3 uppercase tracking-wider">Rejection Reasons</p>
              {(() => {
                const reasons: Record<string, number> = {};
                rejectedQuotes.forEach((q: any) => {
                  const note = q.notes || "";
                  const match = note.match(/REJECTED: (.+)/);
                  const reason = match ? match[1].split(" | ")[0].trim() : "No reason given";
                  reasons[reason] = (reasons[reason] || 0) + 1;
                });
                const total = rejectedQuotes.length;
                return Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                  <div key={reason} className="mb-2">
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-gray-300">{reason}</span>
                      <span className="text-gray-500">{count} ({Math.round(count / total * 100)}%)</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-2 rounded-full" style={{ width: `${count / total * 100}%`, background: "rgba(248,113,113,0.6)" }} />
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Most rejected parts */}
            <div className="mb-5">
              <p className="text-[12px] font-semibold text-gray-400 mb-3 uppercase tracking-wider">Parts Lost Most Often</p>
              <div className="space-y-2">
                {(() => {
                  const parts: Record<string, number> = {};
                  rejectedQuotes.forEach((q: any) => {
                    const req = requests.find((r: any) => r.id === q.request_id);
                    const part = req?.part_needed || "Unknown";
                    parts[part] = (parts[part] || 0) + 1;
                  });
                  return Object.entries(parts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([part, count]) => (
                    <div key={part} className="flex justify-between items-center rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span className="text-[13px] text-gray-300">{part}</span>
                      <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>{count}x rejected</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Supplier rejection rate */}
            <div>
              <p className="text-[12px] font-semibold text-gray-400 mb-3 uppercase tracking-wider">Supplier Rejection Rate</p>
              <div className="space-y-2">
                {(() => {
                  const supStats: Record<string, { rejected: number, total: number, name: string }> = {};
                  allQuotes.forEach((q: any) => {
                    const id = q.supplier_id;
                    const name = q.suppliers?.name || suppliers.find((s: any) => s.id === id)?.name || "Unknown";
                    if (!supStats[id]) supStats[id] = { rejected: 0, total: 0, name };
                    supStats[id].total++;
                    if (q.rejected) supStats[id].rejected++;
                  });
                  return Object.values(supStats)
                    .filter((s: any) => s.total > 0)
                    .sort((a: any, b: any) => (b.rejected / b.total) - (a.rejected / a.total))
                    .slice(0, 5)
                    .map((s: any) => (
                      <div key={s.name} className="flex justify-between items-center rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <span className="text-[13px] text-gray-300">{s.name}</span>
                        <span className="text-[12px]" style={{ color: s.rejected / s.total > 0.3 ? "#f87171" : "#4ade80" }}>
                          {s.rejected}/{s.total} ({Math.round(s.rejected / s.total * 100)}%)
                        </span>
                      </div>
                    ));
                })()}
              </div>
            </div>
          </>
        )}
      </div>

      </div>
    </main>
  );
}'''
c = c.replace(old_closing, new_closing, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has rejectedQuotes:", "rejectedQuotes" in c)
print("has Lost Sales:", "Lost Sales" in c)
