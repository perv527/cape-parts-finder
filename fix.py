pages=["frontend/app/admin/page.tsx","frontend/app/sales/page.tsx","frontend/app/analytics/page.tsx","frontend/app/expenses/page.tsx","frontend/app/reminders/page.tsx","frontend/app/inventory/page.tsx"]
for p in pages:
    c=open(p,encoding="utf-8").read()
    c=c.replace("{ label: \"Sales\", href: \"/sales\"","{ label: \"Sales\", href: \"/sales\" }, { label: \"Customers\", href: \"/customers\"",1)
    open(p,"w",encoding="utf-8").write(c)
    print("Done:", p.split("/")[-2], "has customers:", "/customers" in c)
