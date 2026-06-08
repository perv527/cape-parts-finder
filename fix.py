c=open("frontend/app/track/page.tsx",encoding="utf-8").read()
i=c.find("async function cancelRequest() {")
j=c.find("async function cancelRequest(req: any) {")
print("old at:", i, "new at:", j)
if i>0 and j>0:
    end=c.find("\n\n  ",i+1)
    c=c[:i]+c[end+2:]
    open("frontend/app/track/page.tsx","w",encoding="utf-8").write(c)
    print("Removed old function!")
