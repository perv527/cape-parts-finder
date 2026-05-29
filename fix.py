c=open("frontend/app/page.tsx",encoding="utf-8").read()
old="""    setLoading(true);
    try {
      // Upload all photos"""
open("frontend/app/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "duplicate" in c)
