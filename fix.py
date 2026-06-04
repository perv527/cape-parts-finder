c=open("frontend/app/settings/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
for i in range(136,141): lines[i]=""
open("frontend/app/settings/page.tsx","w",encoding="utf-8").write(chr(10).join(lines))
print("Done")
