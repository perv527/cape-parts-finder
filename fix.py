c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
i=c.find("Internal Notes")
print(repr(c[i-300:i+50]))
