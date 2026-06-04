c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
i=c.find("getStatusMessage")
print(repr(c[i:i+300]))
