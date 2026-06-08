c=open("frontend/app/sales/page.tsx",encoding="utf-8").read()
old="Print Invoice\n                      </button>"
new="Print Invoice\n                      </button>\n                      {sale.request_id && (\n                        <button onClick={() => window.open(\"/quotes/\" + sale.request_id)}\n                          className=\"flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition\"\n                          style={{ background: \"rgba(96,165,250,0.08)\", border: \"1px solid rgba(96,165,250,0.15)\", color: \"#60a5fa\" }}>\n                          View Original Request\n                        </button>\n                      )}"
c=c.replace(old,new,1)
open("frontend/app/sales/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "View Original Request" in c)
