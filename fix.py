c=open("frontend/app/sales/page.tsx",encoding="utf-8").read()
c=c.replace("text-[28px] font-black leading-none\"","text-[22px] font-black leading-none\"",1)
open("frontend/app/sales/page.tsx","w",encoding="utf-8").write(c)
print("Done")
