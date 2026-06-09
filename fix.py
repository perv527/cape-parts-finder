c=open("frontend/app/quotes/[id]/page.tsx",encoding="utf-8").read()
i=c.find("display:\"flex\",alignItems:\"center\",justifyContent:\"space-between\"")
print(repr(c[i-100:i+50]))
