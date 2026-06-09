c=open("frontend/app/analytics/page.tsx",encoding="utf-8").read()
print("lines:", len(c.split(chr(10))))
print("has rejected:", "rejected" in c)
