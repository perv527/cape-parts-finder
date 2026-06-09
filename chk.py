c=open("frontend/app/quotes/[id]/page.tsx",encoding="utf-8").read()
old=">Customer Price</p>\n\n\n\n\n\n\n\n\n\n\n\n\n                </div>"
new=">Customer Price</p>\n                <p className=\"text-[22px] font-black\" style={{ color: \"#4ade80\" }}>\n                  {price && markup ? \"R\" + (Number(price) * (1 + Number(markup) / 100)).toFixed(2) : \"—\"}\n                </p>\n                </div>"
c=c.replace(old,new,1)
open("frontend/app/quotes/[id]/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "Number(price) * (1 + Number(markup)" in c)
