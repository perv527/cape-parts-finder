"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const darkBg = { minHeight: "100vh", background: "#0e0e0e", color: "white", overflowX: "hidden" as const };
const cardStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 };

const NAV_LINKS = [
  { label: "Requests", href: "/admin" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Sales", href: "/sales" },
  { label: "Customers", href: "/customers", active: true },
  { label: "Inventory", href: "/inventory" },
  { label: "Expenses", href: "/expenses" },
  { label: "Analytics", href: "/analytics" },
  { label: "Reminders", href: "/reminders" }, { label: "Settings", href: "/settings" },
];

export default function CustomersPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"spend" | "orders" | "requests" | "name">("spend");
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      fetchData();
    });
  }, []);

  async function fetchData() {
    setLoading(true);
    const [{ data: r }, { data: s }] = await Promise.all([
      supabase.from("parts_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("sales").select("*").order("created_at", { ascending: false }),
    ]);
    setRequests(r || []);
    setSales(s || []);
    setLoading(false);
  }

  // Build customer profiles from requests + sales
  const customerMap: Record<string, any> = {};

  requests.forEach(r => {
    const phone = (r.phone_number || "unknown").replace(/\s/g, "");
    if (!customerMap[phone]) {
      customerMap[phone] = {
        phone, name: r.customer_name || "Unknown",
        area: r.area || "", email: r.email || "",
        requests: [], sales: [], totalSpend: 0, totalProfit: 0,
        firstSeen: r.created_at, lastSeen: r.created_at,
      };
    }
    customerMap[phone].requests.push(r);
    if (new Date(r.created_at) > new Date(customerMap[phone].lastSeen)) customerMap[phone].lastSeen = r.created_at;
    if (new Date(r.created_at) < new Date(customerMap[phone].firstSeen)) customerMap[phone].firstSeen = r.created_at;
  });

  sales.forEach(s => {
    const phone = (s.customer_phone || s.phone_number || "unknown").replace(/\s/g, "");
    // Try match by phone or name
    let key = phone;
    if (!customerMap[key]) {
      // Try match by name
      const nameMatch = Object.keys(customerMap).find(k => 
        customerMap[k].name.toLowerCase() === (s.customer_name || "").toLowerCase()
      );
      if (nameMatch) key = nameMatch;
      else {
        customerMap[key] = {
          phone: key, name: s.customer_name || "Unknown",
          area: "", email: "",
          requests: [], sales: [], totalSpend: 0, totalProfit: 0,
          firstSeen: s.created_at, lastSeen: s.created_at,
        };
      }
    }
    customerMap[key].sales.push(s);
    customerMap[key].totalSpend += Number(s.selling_price || 0);
    customerMap[key].totalProfit += Number(s.profit || 0);
  });

  let customers = Object.values(customerMap);

  // Filter
  if (search.trim()) {
    const q = search.toLowerCase();
    customers = customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.area.toLowerCase().includes(q)
    );
  }

  // Sort
  customers.sort((a, b) => {
    if (sortBy === "spend") return b.totalSpend - a.totalSpend;
    if (sortBy === "orders") return b.sales.length - a.sales.length;
    if (sortBy === "requests") return b.requests.length - a.requests.length;
    return a.name.localeCompare(b.name);
  });

  const totalCustomers = Object.keys(customerMap).length;
  const repeatCustomers = customers.filter(c => c.sales.length >= 2).length;
  const vipCustomers = customers.filter(c => c.sales.length >= 3).length;
  const totalSpendAll = customers.reduce((s, c) => s + c.totalSpend, 0);

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days/30)}mo ago`;
    return `${Math.floor(days/365)}y ago`;
  }

  if (loading) return (
    <main style={darkBg} className="flex items-center justify-center">
      <div className="flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 20px" }}>
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        <p className="text-gray-300 text-sm">Loading customers...</p>
      </div>
    </main>
  );

  return (
    <main style={darkBg}>
      {/* NAV */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-3 h-14 flex items-center gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <span className="font-bold text-white text-[14px] hidden md:block">Cape Parts Finder</span>
          </div>
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide flex-1 mx-1">
            {NAV_LINKS.map(n => (
              <a key={n.href} href={n.href}
                className="px-2.5 py-1.5 rounded-lg text-[11px] no-underline transition font-medium whitespace-nowrap flex-shrink-0"
                style={n.active ? { background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" } : { color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }}>
                {n.label}
              </a>
            ))}
          </div>
          <button onClick={fetchData}
            className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5">

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Customers", value: totalCustomers, color: "#fb923c" },
            { label: "Repeat Buyers", value: repeatCustomers, color: "#60a5fa" },
            { label: "VIP (3+ orders)", value: vipCustomers, color: "#fbbf24" },
            { label: "Total Revenue", value: "R" + totalSpendAll.toFixed(0), color: "#4ade80" },
          ].map(s => (
            <div key={s.label} style={cardStyle} className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</div>
              <div className="text-[22px] font-black" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* SEARCH + SORT */}
        <div style={cardStyle} className="p-4 mb-4">
          <input type="text" placeholder="Search by name, phone or area..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-[13px] outline-none text-white placeholder-gray-600 mb-3"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {([["spend","Top Spend"],["orders","Most Orders"],["requests","Most Requests"],["name","A–Z"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setSortBy(key)}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium cursor-pointer transition whitespace-nowrap flex-shrink-0"
                style={sortBy === key
                  ? { background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c" }
                  : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* CUSTOMER LIST */}
        {customers.length === 0 ? (
          <div style={cardStyle} className="p-12 text-center">
            <div className="text-4xl mb-3">👥</div>
            <div className="text-white font-semibold mb-1">No customers yet</div>
            <div className="text-gray-500 text-[13px]">Customers will appear here once requests are submitted</div>
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map((c, idx) => {
              const isExpanded = expandedPhone === c.phone;
              const isVip = c.sales.length >= 3;
              const isRepeat = c.sales.length >= 2;
              const convRate = c.requests.length > 0 ? ((c.sales.length / c.requests.length) * 100).toFixed(0) : "0";

              return (
                <div key={c.phone} style={{
                  ...cardStyle,
                  border: isVip ? "1px solid rgba(251,191,36,0.25)" : isRepeat ? "1px solid rgba(249,115,22,0.2)" : "1px solid rgba(255,255,255,0.07)",
                  background: isVip ? "rgba(251,191,36,0.03)" : "rgba(255,255,255,0.03)",
                }}>
                  <div className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedPhone(isExpanded ? null : c.phone)}>
                    {/* Rank */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-black flex-shrink-0"
                      style={{ background: idx === 0 ? "rgba(251,191,36,0.2)" : idx === 1 ? "rgba(192,192,192,0.15)" : idx === 2 ? "rgba(180,100,40,0.15)" : "rgba(255,255,255,0.06)", color: idx === 0 ? "#fbbf24" : idx === 1 ? "#d1d5db" : idx === 2 ? "#b46428" : "rgba(255,255,255,0.3)" }}>
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-[14px]">{c.name}</span>
                        {isVip && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>⭐ VIP</span>}
                        {isRepeat && !isVip && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.1)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}>Repeat</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        <span>{c.phone}</span>
                        {c.area && <><span>·</span><span>{c.area}</span></>}
                        <span>·</span><span>Last seen {timeAgo(c.lastSeen)}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="font-black text-[16px]" style={{ color: "#4ade80" }}>R{c.totalSpend.toFixed(0)}</div>
                        <div className="text-[10px] text-gray-600">spent</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="font-black text-[16px] text-white">{c.sales.length}</div>
                        <div className="text-[10px] text-gray-600">orders</div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      {/* Stats row */}
                      <div className="grid grid-cols-4 gap-3 px-4 py-4">
                        {[
                          { label: "Total Spend", value: "R" + c.totalSpend.toFixed(0), color: "#4ade80" },
                          { label: "Total Profit", value: "R" + c.totalProfit.toFixed(0), color: "#60a5fa" },
                          { label: "Orders", value: c.sales.length, color: "#fb923c" },
                          { label: "Requests", value: c.requests.length, color: "#c084fc" },
                        ].map(s => (
                          <div key={s.label} className="text-center">
                            <div className="font-black text-[18px]" style={{ color: s.color }}>{s.value}</div>
                            <div className="text-[10px] text-gray-600">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Recent requests */}
                      {c.requests.length > 0 && (
                        <div className="px-4 pb-3">
                          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Recent Requests</div>
                          <div className="space-y-1.5">
                            {c.requests.slice(0, 4).map((r: any) => (
                              <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                                <span className="text-[12px] text-gray-300">{r.part_needed}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-600">{new Date(r.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>{r.status || "New"}</span>
                                </div>
                              </div>
                            ))}
                            {c.requests.length > 4 && <p className="text-[11px] text-gray-600 px-3">+{c.requests.length - 4} more requests</p>}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="px-4 pb-4 flex gap-2 flex-wrap">
                        <a href={"https://wa.me/" + c.phone.replace(/\D/g, "") + "?text=" + encodeURIComponent("Hi " + c.name + ", this is Cape Parts Finder. How can we help you today?")}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold no-underline transition"
                          style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)", color: "#25D366" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                          WhatsApp
                        </a>
                        {c.email && (
                          <a href={"mailto:" + c.email}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium no-underline transition"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                            Email
                          </a>
                        )}
                        <div className="ml-auto text-right">
                          <div className="text-[10px] text-gray-600">Conversion rate</div>
                          <div className="font-bold text-[14px]" style={{ color: Number(convRate) >= 50 ? "#4ade80" : "#fb923c" }}>{convRate}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
