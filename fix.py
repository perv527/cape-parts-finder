c=open("frontend/app/page.tsx",encoding="utf-8").read()
print("has referral:", "referral_source" in c)
print("has dropdown:", "How did you hear" in c)
