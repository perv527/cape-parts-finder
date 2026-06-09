c=open("frontend/app/quotes/[id]/page.tsx",encoding="utf-8").read()
c=c.replace("  const [sales, setSales] = useState<any[]>([]);","  const [sales, setSales] = useState<any[]>([]);\n  const [aiSuggestion, setAiSuggestion] = useState<any>(null);\n  const [loadingAi, setLoadingAi] = useState(false);",1)
open("frontend/app/quotes/[id]/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "loadingAi" in c and "aiSuggestion" in c)
