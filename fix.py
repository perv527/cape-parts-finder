c=open("frontend/app/review/page.tsx",encoding="utf-8").read()
print("lines:", len(c.split(chr(10))))
i=c.find("handleSubmit")
print(repr(c[i:i+300]))
