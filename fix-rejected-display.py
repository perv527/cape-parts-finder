path = r"frontend/app/quotes/[id]/page.tsx"
c = open(path, encoding="utf-8").read()

# Hide Convert to Sale and Edit Price when quote is rejected
old_convert = '                    <button onClick={() => setConfirmModal(quote)}'
new_convert = '                    {!quote.rejected && <button onClick={() => setConfirmModal(quote)}'

# Find and wrap convert to sale button
i = c.find('Convert to Sale\n                    </button>')
if i > 0:
    # Find the button start
    k = c.rfind('<button', 0, i)
    end = c.find('</button>', i) + 9
    old_btn = c[k:end]
    new_btn = '{!quote.rejected && (' + old_btn + ')}'
    c = c[:k] + new_btn + c[end:]
    print("Wrapped Convert to Sale!")

# Wrap Edit Price button
i2 = c.find('Edit Price\n                    </button>')
if i2 > 0:
    k2 = c.rfind('<button', 0, i2)
    end2 = c.find('</button>', i2) + 9
    old_btn2 = c[k2:end2]
    new_btn2 = '{!quote.rejected && (' + old_btn2 + ')}'
    c = c[:k2] + new_btn2 + c[end2:]
    print("Wrapped Edit Price!")

open(path, "w", encoding="utf-8").write(c)
print("Done!")
