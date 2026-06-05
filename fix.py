c=open("frontend/app/inventory/page.tsx",encoding="utf-8").read()
i=c.find("totalStock")
print(repr(c[i-50:i+150]))
