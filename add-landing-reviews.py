path = "frontend/app/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add reviews state
old_state = '  const [loading, setLoading] = useState(false);'
new_state = '''  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("reviews").select("customer_name,rating,comment,part_sourced,created_at")
      .gte("rating", 4).order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => setReviews(data || []));
  }, []);'''
c = c.replace(old_state, new_state, 1)

# 2. Add useEffect import
old_import = 'import { useState } from "react";'
new_import = 'import { useState, useEffect } from "react";'
c = c.replace(old_import, new_import, 1)

# 3. Add reviews section between trust badges and form card
old_form = '          {/* FORM CARD */}\n          <div className="max-w-xl mx-auto">'
new_form = '''          {/* REVIEWS SECTION */}
          {reviews.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-[13px] font-bold text-white">
                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                  </span>
                  <span className="text-[12px] text-gray-500">({reviews.length} reviews)</span>
                </div>
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
                {reviews.slice(0, 3).map((r, i) => (
                  <div key={i} className="rounded-2xl p-4 text-left" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} width="12" height="12" viewBox="0 0 24 24"
                          fill={s <= r.rating ? "#fbbf24" : "none"}
                          stroke={s <= r.rating ? "#fbbf24" : "rgba(255,255,255,0.15)"}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                    </div>
                    {r.comment && <p className="text-[13px] text-gray-300 leading-relaxed mb-3">"{r.comment}"</p>}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: "rgba(249,115,22,0.15)", color: "#fb923c" }}>
                        {(r.customer_name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold text-white">{r.customer_name}</div>
                        {r.part_sourced && <div className="text-[10px] text-gray-600">{r.part_sourced}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FORM CARD */}
          <div className="max-w-xl mx-auto">'''
c = c.replace(old_form, new_form, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has reviews state:", "setReviews" in c)
print("has reviews section:", "REVIEWS SECTION" in c)
print("has useEffect:", "useEffect" in c)
