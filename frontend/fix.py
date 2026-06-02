pages=["frontend/app/admin/page.tsx","frontend/app/suppliers/page.tsx","frontend/app/sales/page.tsx","frontend/app/analytics/page.tsx"]
for p in pages:
    c=open(p,encoding="utf-8").read()
    c=c.replace("minHeight: \"100vh\", overflowX: \"hidden\"","minHeight: \"100vh\", overflowX: \"hidden\" as const")
    open(p,"w",encoding="utf-8").write(c)
    print("Done:", p.split("/")[-2])
