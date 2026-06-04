c=open("frontend/app/quotes/[id]/page.tsx",encoding="utf-8").read()
c=c.replace("            ))}\n          </div>","            );\n            })}\n          </div>",1)
open("frontend/app/quotes/[id]/page.tsx","w",encoding="utf-8").write(c)
print("Done")
