c=open("frontend/app/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
[print(i+1,repr(lines[i])) for i in range(39,45)]
