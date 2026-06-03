c=open("frontend/app/expenses/page.tsx",encoding="utf-8").read()
print("has supabase insert:", "from(\"expenses\").insert" in c)
print("has amount field:", "amount" in c)
