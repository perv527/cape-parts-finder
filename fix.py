c=open("frontend/app/sales/page.tsx",encoding="utf-8").read()
c=c.replace("overflowX: \"hidden\" as const as const","overflowX: \"hidden\" as const",1)
open("frontend/app/sales/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "as const as const" not in c)
