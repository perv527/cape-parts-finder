c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
i=c.find("ordered:")
print(repr(c[i:i+500]))
