c=open("frontend/app/analytics/page.tsx",encoding="utf-8").read()
c=c.replace("{ label: \"Analytics\", href: \"/analytics\", active: true }].map","{ label: \"Expenses\", href: \"/expenses\" }, { label: \"Analytics\", href: \"/analytics\", active: true }].map",1)
open("frontend/app/analytics/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "/expenses" in c)
