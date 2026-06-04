pages=["frontend/app/admin/page.tsx","frontend/app/customers/page.tsx","frontend/app/expenses/page.tsx","frontend/app/reminders/page.tsx"]
for p in pages:
    c=open(p,encoding="utf-8").read()
    c=c.replace("{ label: \"Settings\", href: \"/settings\" } },","{ label: \"Settings\", href: \"/settings\" },")
    c=c.replace("{ label: \"Settings\", href: \"/settings\" }, badge: reminderDueCount },","{ label: \"Settings\", href: \"/settings\" }, { label: \"Reminders\", href: \"/reminders\", badge: reminderDueCount },")
    c=c.replace("{ label: \"Settings\", href: \"/settings\" }, active: true },","{ label: \"Settings\", href: \"/settings\" }, { label: \"Reminders\", href: \"/reminders\", active: true },")
    open(p,"w",encoding="utf-8").write(c)
    print("Done:", p.split("/")[-2])
