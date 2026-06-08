c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
i=c.find("async function saveEdit()")
j=c.find("async function saveEdit()",i+1)
print("first at:", i, "second at:", j)
if j>0:
    end=c.find("const NAV_LINKS",j)
    c=c[:j]+c[end:]
    open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(c)
    print("Removed duplicate!")
