c=open("frontend/app/page.tsx",encoding="utf-8").read()
c=c.replace("            requestId: data?.[0]?.id,\n","",1)
open("frontend/app/page.tsx","w",encoding="utf-8").write(c)
print("Done")
