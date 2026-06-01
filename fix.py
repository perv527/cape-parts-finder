c=open("frontend/app/analytics/page.tsx",encoding="utf-8").read()
i=c.find("getReferralSources")
print(c[i-30:i+50])
