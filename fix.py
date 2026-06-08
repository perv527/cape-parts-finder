c=open("frontend/app/quotes/[id]/page.tsx",encoding="utf-8").read()
i=c.find("Edit Price")
print(repr(c[i+100:i+400]))
