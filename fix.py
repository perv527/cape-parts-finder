c=open("frontend/app/quotes/[id]/page.tsx",encoding="utf-8").read()
i=c.find("Supplier Price")
print(repr(c[i-300:i+400]))
