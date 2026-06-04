c=open("frontend/app/suppliers/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
extracted=chr(10).join(lines[8:33])
for i in range(8,33): lines[i]=""
i=next(j for j,l in enumerate(lines) if "return (" in l and j>100)
lines.insert(i,extracted)
open("frontend/app/suppliers/page.tsx","w",encoding="utf-8").write(chr(10).join(lines))
print("Done")
