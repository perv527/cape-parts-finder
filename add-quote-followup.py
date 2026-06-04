import re

path = r"frontend/app/quotes/[id]/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add isStale calculation before the quote card render
old_map = 'return quotes.map((quote'
new_map = '''const now = Date.now();
  const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

  return quotes.map((quote'''
c = c.replace(old_map, new_map, 1)

# 2. Add stale detection inside the map
old_quote_var = 'const quoteNum = `CPF-${String(request.id)'
new_quote_var = '''const isStale = !quote.sale_id && (now - new Date(quote.created_at).getTime()) > TWO_DAYS;
      const daysOld = Math.floor((now - new Date(quote.created_at).getTime()) / 86400000);
      const quoteNum = `CPF-${String(request.id)'''
c = c.replace(old_quote_var, new_quote_var, 1)

# 3. Add stale badge and follow-up button to quote card header
# Find the quote card header area - look for the marked up price display
old_price = 'className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Customer Price</p>'
new_price = '''className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Customer Price</p>
                    {isStale && (
                      <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <span style={{ color: "#f87171", fontSize: 12 }}>⏰ Quote {daysOld} days old — no response</span>
                        <a href={"https://wa.me/" + (request.phone_number || "").replace(/\\D/g,"") + "?text=" + encodeURIComponent("Hi " + (request.customer_name || "there") + ", just following up on the quote we sent for " + (request.part_needed || "your part") + ". Are you still interested? Cape Parts Finder")}
                          target="_blank" rel="noopener noreferrer"
                          className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold no-underline flex-shrink-0"
                          style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", color: "#25D366" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.5l5.802-1.522A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.86 0-3.605-.5-5.112-1.374l-.366-.217-3.443.903.921-3.36-.239-.386A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                          Follow up
                        </a>
                      </div>
                    )}'''
c = c.replace(old_price, new_price, 1)

# 4. Add stale border highlight to quote card
old_card_style = 'style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, marginBottom: 12, overflow: "hidden" }}'
new_card_style = 'style={{ background: isStale ? "rgba(239,68,68,0.03)" : "rgba(255,255,255,0.03)", border: isStale ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 16, marginBottom: 12, overflow: "hidden" }}'
c = c.replace(old_card_style, new_card_style, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has isStale:", "isStale" in c)
print("has daysOld:", "daysOld" in c)
print("has Follow up:", "Follow up" in c)
