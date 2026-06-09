c=open("frontend/app/quotes/[id]/page.tsx",encoding="utf-8").read()
old="<span style={{ color: \"#a78bfa\" }}>AI: {aiSuggestion.markup}% → R{aiSuggestion.selling_price}</span>"
new="<span style={{ color: \"#a78bfa\" }}>AI: {aiSuggestion.markup}% → R{aiSuggestion.selling_price}</span>\n                      <button onClick={() => { setMarkup(String(aiSuggestion.markup)); setAiSuggestion(null); }} className=\"px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer\" style={{ background: \"rgba(139,92,246,0.2)\", border: \"1px solid rgba(139,92,246,0.3)\", color: \"#a78bfa\" }}>Use this</button>"
c=c.replace(old,new,1)
open("frontend/app/quotes/[id]/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "Use this" in c)
