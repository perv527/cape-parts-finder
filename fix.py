c=open("frontend/app/page.tsx",encoding="utf-8").read()
c=c.replace("\n<a href=\"https://wa.me/27696863952","",1)
open("frontend/app/page.tsx","w",encoding="utf-8").write(c)
print("Done:", c.count("wa.me"))
