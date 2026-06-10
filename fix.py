c=open("frontend/app/catalogue/page.tsx",encoding="utf-8").read()
c=c.replace("useEffect(() => { fetchParts(); }, []);","useEffect(() => {\n    supabase.auth.getSession().then(({ data: { session } }) => {\n      if (!session) { window.location.href = \"/login\"; return; }\n      fetchParts();\n    });\n  }, []);",1)
open("frontend/app/catalogue/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "getSession" in c)
