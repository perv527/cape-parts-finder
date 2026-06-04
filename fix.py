c=open("frontend/app/quotes/[id]/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
for i in range(679,691): lines[i]=""
open("frontend/app/quotes/[id]/page.tsx","w",encoding="utf-8").write(chr(10).join(lines))
print("Done")
