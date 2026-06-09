path = r"frontend/app/quotes/[id]/page.tsx"
c = open(path, encoding="utf-8").read()

# Find and replace the entire broken markup section
old = '''          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}><p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Markup %</p><button onClick={getAiSuggestion} disabled={loadingAi} className="px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>{loadingAi ? "Thinking..." : "AI Suggest"}</button></div>{aiSuggestion && (<div className="rounded-xl p-3 mb-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}><div className="flex justify-between text-[12px] mb-1"><span className="font-semibold" style={{ color: "#a78bfa" }}>AI: {aiSuggestion.markup}% markup</span><span className="text-white font-bold">R{aiSuggestion.selling_price}</span></div><p className="text-[11px] text-gray-500">{aiSuggestion.reason}</p></div>)}'''

new = '''              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Markup %</p>
                  <button onClick={getAiSuggestion} disabled={loadingAi}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer"
                    style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                    {loadingAi ? "Thinking..." : "AI Suggest"}
                  </button>
                </div>
                {aiSuggestion && (
                  <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="font-semibold" style={{ color: "#a78bfa" }}>AI: {aiSuggestion.markup}% markup</span>
                      <span className="text-white font-bold">R{aiSuggestion.selling_price}</span>
                    </div>
                    <p className="text-[11px] text-gray-500">{aiSuggestion.reason}</p>
                  </div>
                )}'''

if old in c:
    c = c.replace(old, new, 1)
    print("Fixed!")
else:
    print("Not found - trying partial match")
    i = c.find('display:"flex",alignItems:"center",justifyContent:"space-between"')
    j = c.find('aiSuggestion.reason}</p></div>)}', i)
    if i > 0 and j > 0:
        end = j + len('aiSuggestion.reason}</p></div>)}')
        # Find start of the div
        start = c.rfind('<div style={{display', 0, i)
        print(f"Found from {start} to {end}")
        c = c[:start] + new + c[end:]
        print("Fixed via partial!")
    else:
        print("Could not find section")

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has AI Suggest:", "AI Suggest" in c)
