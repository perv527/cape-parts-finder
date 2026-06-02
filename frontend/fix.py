c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
c=c.replace("justify-center p-4\" style={{ zIndex: 200 }} style={{ background: \"rgba(0,0,0,0.7)\", zIndex: 100, backdropFilter: \"blur(4px)\" }}","justify-center p-4\" style={{ background: \"rgba(0,0,0,0.75)\", zIndex: 200, backdropFilter: \"blur(4px)\" }}",1)
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "style={{ zIndex: 200 }} style" not in c)
