path = r"frontend/app/quotes/[id]/page.tsx"
c = open(path, encoding="utf-8").read()

old = '''<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-[13px] outline-none cursor-pointer text-white col-span-2"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <option value="" style={{ background: "#1a1a1a" }}>Select Supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id} style={{ background: "#1a1a1a" }}>{s.name}</option>)}
              </select>
           <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[13px]">R</span>
  <input type="text" inputMode="decimal" placeholder="Supplier Price" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g,""))}
     className="w-full rounded-xl pl-7 pr-3 py-3 text-[13px] outline-none text-white placeholder-gray-600"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>'''

new = '''<div className="flex flex-col gap-3 mb-4">
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                className="w-full rounded-xl px-3 py-3 text-[14px] outline-none cursor-pointer text-white"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <option value="" style={{ background: "#1a1a1a" }}>Select Supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id} style={{ background: "#1a1a1a" }}>{s.name}</option>)}
              </select>
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Supplier Cost (R) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] font-bold">R</span>
                  <input type="text" inputMode="decimal" placeholder="e.g. 350.00" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g,""))}
                    className="w-full rounded-xl pl-8 pr-3 py-3.5 text-[16px] outline-none text-white placeholder-gray-600 font-semibold"
                    style={{ background: "rgba(255,255,255,0.07)", border: "2px solid rgba(249,115,22,0.3)" }} />
                </div>
              </div>'''

if old in c:
    c = c.replace(old, new, 1)
    print("Fixed!")
else:
    print("Not found - checking spacing issues")
    # Try with normalized whitespace
    import re
    old_pattern = r'<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">'
    match = re.search(old_pattern, c)
    if match:
        print("Found grid at:", match.start())
        c = c.replace('<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">', '<div className="flex flex-col gap-3 mb-4">', 1)
        # Fix the price input container
        c = c.replace('col-span-2"\n                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>', 'className_fix"\n                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>', 1)
        print("Fixed grid!")

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has flex flex-col:", "flex flex-col gap-3 mb-4" in c)
