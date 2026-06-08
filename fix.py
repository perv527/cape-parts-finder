c=open("frontend/app/track/page.tsx",encoding="utf-8").read()
i=c.find("setRequests(")
print(repr(c[i:i+100]))
