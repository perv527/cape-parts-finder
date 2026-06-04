c=open("frontend/app/suppliers/page.tsx",encoding="utf-8").read()
print("has getSupplierStats:", "getSupplierStats" in c)
print("has quotes state:", "setQuotes" in c)
