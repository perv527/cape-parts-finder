c=open("frontend/app/suppliers/page.tsx",encoding="utf-8").read()
c=c.replace("Add Supplier\n            </button>\n          </div>\n        </header>","Add Supplier\n            </button>\n            <button onClick={() => setShowPerf(!showPerf)} className=\"px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition\" style={showPerf ? { background: \"rgba(249,115,22,0.12)\", border: \"1px solid rgba(249,115,22,0.2)\", color: \"#fb923c\" } : { background: \"rgba(255,255,255,0.05)\", border: \"1px solid rgba(255,255,255,0.08)\", color: \"rgba(255,255,255,0.6)\" }}>Performance</button>\n          </div>\n        </header>",1)
open("frontend/app/suppliers/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "setShowPerf" in c)
