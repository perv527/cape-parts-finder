c=open("frontend/app/quotes/[id]/page.tsx",encoding="utf-8").read()
c=c.replace("<div className=\"flex items-center justify-between mb-2\"><p className=\"text-[10px] font-bold uppercase tracking-widest\"","<div style={{display:\"flex\",alignItems:\"center\",justifyContent:\"space-between\",marginBottom:\"8px\"}}><p className=\"text-[10px] font-bold uppercase tracking-widest\"",1)
open("frontend/app/quotes/[id]/page.tsx","w",encoding="utf-8").write(c)
print("Done")
