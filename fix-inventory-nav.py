path = "frontend/app/inventory/page.tsx"
c = open(path, encoding="utf-8").read()

# Fix nav flex
old_nav = 'className="flex gap-1 overflow-x-auto scrollbar-hide"'
new_nav = 'className="flex gap-0.5 overflow-x-auto scrollbar-hide flex-1 mx-1"'
if old_nav in c:
    c = c.replace(old_nav, new_nav, 1)
    print("Fixed nav!")
else:
    print("Nav not found")

# Find and fix total stock display
i = c.find("units")
if i > 0:
    print("units context:", repr(c[i-100:i+50]))

# Fix stat card font size - find the stat value display
old_font = 'text-[28px] font-black'
if old_font in c:
    c = c.replace(old_font, 'text-[22px] font-black', 1)
    print("Fixed font size!")

# Remove "units" from the stock value to prevent overflow
c = c.replace('`${totalStock} units`', 'String(totalStock)')
c = c.replace('"units"', '"u"')

open(path, "w", encoding="utf-8").write(c)
print("Done!")
