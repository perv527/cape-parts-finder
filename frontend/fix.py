c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
c=c.replace("const matchesArchive = !hideArchived || (r.status || \"New\") !== \"Closed\";","const matchesArchive = search.trim() ? true : (!hideArchived || (r.status || \"New\") !== \"Closed\");",1)
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "search.trim()" in c)
