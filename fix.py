c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
lines[376]="                        <span className=\"text-[10px]\" style={{ color: st.text }}>{request.status || \"New\"}</span>{isStale && <span style={{marginLeft:6,background:\"rgba(239,68,68,0.12)\",border:\"1px solid rgba(239,68,68,0.25)\",color:\"#f87171\",borderRadius:999,fontSize:9,fontWeight:700,padding:\"2px 7px\"}}>Follow up</span>}"
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(chr(10).join(lines))
print("Done")
