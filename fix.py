import os
pages=["frontend/app/analytics/page.tsx","frontend/app/customers/page.tsx","frontend/app/expenses/page.tsx","frontend/app/reminders/page.tsx","frontend/app/reviews-admin/page.tsx","frontend/app/sales/page.tsx","frontend/app/settings/page.tsx"]
for p in pages:
    c=open(p,encoding="utf-8").read()
    c=c.replace("if (!session) { router.push(\"/login\"); return; }\n      await supabase.auth.refreshSession();","if (!session) { router.push(\"/login\"); return; }",1)
    c=c.replace("if (!session) { router.push(\"/login\"); return; }\n    await supabase.auth.refreshSession();","if (!session) { router.push(\"/login\"); return; }",1)
    open(p,"w",encoding="utf-8").write(c)
    print("Fixed:", p.split("/")[-2])
