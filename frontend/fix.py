c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
i=c.find("Logout")
print(c[i-200:i+200])
