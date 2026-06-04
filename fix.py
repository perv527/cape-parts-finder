c=open("frontend/app/quotes/[id]/page.tsx",encoding="utf-8").read()
i=c.find("Customer Price")
print(repr(c[i-100:i+100]))
