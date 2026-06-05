c=open("frontend/app/page.tsx",encoding="utf-8").read()
i=c.find("async function handleSubmit")
print(repr(c[i:i+600]))
