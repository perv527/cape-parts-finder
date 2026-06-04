c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
old="""NAV_LINKS = [
    { label: "Requests", href: "/admin", active: true },
    { label: "Suppliers", href: "/suppliers" },
    { label: "Sales", href: "/sales" }, { label: "Customers", href: "/customers" },
    { label: "Inventory", href: "/inventory" },
    { label: "Analytics", href: "/analytics" },
    { label: "Reminders", href: "/reminders" }, { label: "Settings", href: "/settings" }, { label: "Reminders", href: "/reminders", badge: reminderDueCount },
  ];"""
new="""NAV_LINKS = [
    { label: "Requests", href: "/admin", active: true },
    { label: "Suppliers", href: "/suppliers" },
    { label: "Sales", href: "/sales" },
    { label: "Customers", href: "/customers" },
    { label: "Inventory", href: "/inventory" },
    { label: "Expenses", href: "/expenses" },
    { label: "Analytics", href: "/analytics" },
    { label: "Reminders", href: "/reminders", badge: reminderDueCount },
    { label: "Reviews", href: "/reviews-admin" },
    { label: "Settings", href: "/settings" },
  ];"""
c=c.replace(old,new,1)
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "reviews-admin" in c and c.count("/reminders") == 1)
