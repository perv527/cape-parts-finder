path = r"frontend/app/quotes/[id]/page.tsx"
c = open(path, encoding="utf-8").read()

old = '''className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(34,197,94,0.7)" }}>Customer Price</p>
                  <p className="text-[18px] font-black" style={{ color: "#4ade80"'''

new = '''className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(34,197,94,0.7)" }}>Customer Price</p>
                  {isStale && (
                    <div className="mt-2 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl flex-wrap" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <span style={{ color: "#f87171", fontSize: 11 }}>Quote {daysOld} days old — no response</span>
                      <a href={"https://wa.me/" + (request.phone_number || "").replace(/\\D/g,"") + "?text=" + encodeURIComponent("Hi " + (request.customer_name || "there") + ", just following up on the quote we sent for " + (request.part_needed || "your part") + ". Are you still interested? Cape Parts Finder")}
                        target="_blank" rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold no-underline flex-shrink-0"
                        style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", color: "#25D366" }}>
                        Follow up
                      </a>
                    </div>
                  )}
                  <p className="text-[18px] font-black" style={{ color: "#4ade80"'''

c = c.replace(old, new, 1)
open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has Follow up:", "Follow up" in c)
