c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
i=c.find("View Quotes")
print(repr(c[i-100:i+200]))
