c=open("frontend/app/suppliers/page.tsx",encoding="utf-8").read()
old="<p className=\"text-[11px] text-gray-500 mt-0.5\">{supplier.speciality || \"General Parts\"}</p>"
new="<p className=\"text-[11px] text-gray-500 mt-0.5\">{supplier.speciality || \"General Parts\"}</p>\n                  <button onClick={e => { e.stopPropagation(); setRatingModal(supplier); setRating(0); setRatingNote(\"\"); }}\n                    className=\"mt-1.5 flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer\"\n                    style={{ background: \"rgba(249,115,22,0.08)\", border: \"1px solid rgba(249,115,22,0.15)\", color: \"#fb923c\" }}>\n                    Rate Supplier\n                  </button>"
c=c.replace(old,new,1)
open("frontend/app/suppliers/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "Rate Supplier" in c)
