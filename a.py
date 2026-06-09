c=open("frontend/app/suppliers/page.tsx",encoding="utf-8").read()
i=c.find("supplierStats.filter")
print("supplierStats.filter at:", i)
print(repr(c[i-150:i+100]))
