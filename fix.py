c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
c=c.replace("className=\"flex gap-1 overflow-x-auto scrollbar-hide\" style={{ maxWidth: \"calc(100vw - 120px)\" }}","className=\"flex gap-1 overflow-x-auto scrollbar-hide flex-1 mx-1\"",1)
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(c)
print("nav fixed:", "flex-1 mx-1" in c)
