c=open("frontend/app/analytics/page.tsx",encoding="utf-8").read()
c=c.replace("  const referralSources = getReferralSources();","  const referralSources = (()=>{const counts={};requests.forEach(r=>{if(r.referral_source)counts[r.referral_source]=(counts[r.referral_source]||0)+1;});return Object.entries(counts).sort((a,b)=>b[1]-a[1]);})();",1)
open("frontend/app/analytics/page.tsx","w",encoding="utf-8").write(c)
print("Done")
