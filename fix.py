c=open("frontend/app/page.tsx",encoding="utf-8").read()
c=c.replace("admin@capepartsfinder.co.za","safri38@outlook.com",1)
open("frontend/app/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "safri38@outlook.com" in c)
