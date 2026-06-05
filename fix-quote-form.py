path = r"frontend/app/quotes/[id]/page.tsx"
c = open(path, encoding="utf-8").read()

# Find the add quote form section and restructure it
old_form = '''              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[13px]">R</span>
       <input type="text" inputMode="decimal" placeholder="Supplier Price" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g,""))}
          className="w-full rounded-xl pl-7 pr-3 py-3 text-[13px] outline-none text-white placeholder-gray-600"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>'''

new_form = '''              <div>
                <label className="text-[11px] text-gray-500 mb-1.5 block font-medium">Supplier Cost (R) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[14px] font-bold">R</span>
                  <input type="text" inputMode="decimal" placeholder="Enter supplier price" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g,""))}
                    className="w-full rounded-xl pl-8 pr-3 py-3.5 text-[15px] outline-none text-white placeholder-gray-600 font-semibold"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }} />
                </div>
              </div>'''

if old_form in c:
    c = c.replace(old_form, new_form, 1)
    print("Fixed price input!")
else:
    print("Price input not found - trying alternate")
    # Try to find and fix differently
    i = c.find('placeholder="Supplier Price"')
    if i > 0:
        print("Found at:", i)
        print("Context:", repr(c[i-100:i+100]))

# Also fix the markup section - add a label
old_markup = '''<input type="text" inputMode="decimal" value={markup} onChange={(e) => setMarkup(e.target.value.replace(/[^0-9.]/g,""))}
                    className="w-full rounded-xl px-3 py-2 text-[13px] outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />'''
new_markup = '''<input type="text" inputMode="decimal" value={markup} onChange={(e) => setMarkup(e.target.value.replace(/[^0-9.]/g,""))}
                    className="w-full rounded-xl px-3 py-3 text-[14px] outline-none text-white font-semibold"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }} />'''

if old_markup in c:
    c = c.replace(old_markup, new_markup, 1)
    print("Fixed markup input!")
else:
    print("Markup input not found")

open(path, "w", encoding="utf-8").write(c)
print("Done!")
