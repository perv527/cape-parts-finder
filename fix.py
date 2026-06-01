c=open("frontend/app/sales/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
for i in range(275,281): lines[i]=""
open("frontend/app/sales/page.tsx","w",encoding="utf-8").write(chr(10).join(lines))
print("Done")
