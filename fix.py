c=open("frontend/app/page.tsx",encoding="utf-8").read()
c=c.replace("Track Request →\n            </a>","Track Request →\n            </a>\n            <a href=\"/catalogue\" className=\"px-3 py-1.5 rounded-lg text-[12px] font-medium no-underline transition\" style={{ background: \"rgba(255,255,255,0.05)\", border: \"1px solid rgba(255,255,255,0.1)\", color: \"rgba(255,255,255,0.6)\" }}>Parts Catalogue</a>",1)
open("frontend/app/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "/catalogue" in c)
