pages=["frontend/app/admin/page.tsx","frontend/app/suppliers/page.tsx","frontend/app/sales/page.tsx","frontend/app/analytics/page.tsx","frontend/app/expenses/page.tsx","frontend/app/reminders/page.tsx","frontend/app/customers/page.tsx","frontend/app/inventory/page.tsx"]
for p in pages:
    c=open(p,encoding="utf-8").read()
    c=c.replace("{ label: \"Reminders\", href: \"/reminders\"","{ label: \"Reminders\", href: \"/reminders\" }, { label: \"Settings\", href: \"/settings\" }")
    open(p,"w",encoding="utf-8").write(c)
    print("Done:", p.split("/")[-2], "has settings:", "/settings" in c)
