c=open("frontend/app/track/page.tsx",encoding="utf-8").read()
c=c.replace("const [cancelling, setCancelling] = useState(false);","const [cancelling, setCancelling] = useState<number|null>(null);",1)
open("frontend/app/track/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "number|null" in c)
