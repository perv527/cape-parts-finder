c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
[print(i+1,repr(lines[i])) for i in range(len(lines)) if lines[i].count("style={{")>1 and "zIndex: 200" in lines[i]]
