c=open("frontend/app/api/send-email/route.ts",encoding="utf-8").read()
print("lines:", len(c.split(chr(10))))
print("has resend:", "resend" in c.lower())
