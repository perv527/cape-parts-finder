c=open("frontend/app/page.tsx",encoding="utf-8").read()
print("lines:", len(c.split(chr(10))))
print("has success return:", "if (success)" in c)
