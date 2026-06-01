import os
c=open("frontend/app/sales/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
print(repr(lines[199]))
