path = r"frontend/app/quotes/[id]/page.tsx"
c = open(path, encoding="utf-8").read()

# Remove the wrongly inserted AI section from the edit price modal
old_wrong = '''              <div>
                    <div>
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

new_correct = '''              <div>'''

if old_wrong in c:
    c = c.replace(old_wrong, new_correct, 1)
    print("Removed from wrong location!")
else:
    print("Wrong location not found - trying alternate")
    # Find the double div issue
    i = c.find('<div>\n                    <div>\n                <div style={{ display: "flex"')
    if i > 0:
        j = c.find('aiSuggestion.reason}</p></div>\n                )\n              }', i)
        if j > 0:
            end = j + len('aiSuggestion.reason}</p></div>\n                )\n              }')
            c = c[:i] + '<div>' + c[end:]
            print("Fixed via alternate!")

# Now add it to the Add Quote form - find the markup section there
# Look for the quick markup buttons in the add quote form (not edit modal)
old_add_markup = '            <div className="flex gap-1.5 mb-1.5 flex-wrap">\n                  {["10","15","20","25","30"].map(m => ('
if old_add_markup in c:
    new_add_markup = '''            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Markup</span>
                  <button onClick={getAiSuggestion} disabled={loadingAi}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer"
                    style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                    {loadingAi ? "Thinking..." : "AI Suggest"}
                  </button>
                </div>
                {aiSuggestion && (
                  <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span style={{ color: "#a78bfa" }}>AI: {aiSuggestion.markup}% → R{aiSuggestion.selling_price}</span>
                    </div>
                    <p className="text-[11px] text-gray-500">{aiSuggestion.reason}</p>
                  </div>
                )}
                <div className="flex gap-1.5 mb-1.5 flex-wrap">
                  {["10","15","20","25","30"].map(m => ('''
    c = c.replace(old_add_markup, new_add_markup, 1)
    print("Added AI button to Add Quote form!")
else:
    print("Add Quote markup section not found")

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("AI Suggest count:", c.count("AI Suggest"))
