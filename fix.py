c=open("frontend/app/suppliers/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
func=chr(10).join(lines[218:237])
for i in range(218,237): lines[i]=""
lines.insert(217,func)
open("frontend/app/suppliers/page.tsx","w",encoding="utf-8").write(chr(10).join(lines))
print("Done")
