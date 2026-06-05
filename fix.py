c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
c=c.replace("style={{ background: \"#1a1a1a\", border: \"1px solid rgba(255,255,255,0.1)\", maxHeight: \"90vh\", overflowY: \"auto\" }}>","style={{ background: \"#1a1a1a\", border: \"1px solid rgba(255,255,255,0.1)\", maxHeight: \"85vh\", overflowY: \"auto\", paddingBottom: \"env(safe-area-inset-bottom, 16px)\" }}>")
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "safe-area" in c)
