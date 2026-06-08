c=open("frontend/app/suppliers/page.tsx",encoding="utf-8").read()
c=c.replace("{ label: \"Avg Price\", value: s.stats.avgPrice > 0 ? \"R\" + s.stats.avgPrice.toFixed(0) : \"\\u2014\", color: \"#fb923c\" },","{ label: \"Avg Price\", value: s.stats.avgPrice > 0 ? \"R\" + s.stats.avgPrice.toFixed(0) : \"\\u2014\", color: \"#fb923c\" },\n                          { label: \"Avg Response\", value: s.stats.avgResponseHrs !== null ? s.stats.avgResponseHrs + \"hrs\" : \"\\u2014\", color: \"#c084fc\" },",1)
open("frontend/app/suppliers/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "avgResponseHrs" in c)
