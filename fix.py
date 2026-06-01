c=open("frontend/app/analytics/page.tsx",encoding="utf-8").read()
c=c.replace("  const referralSources = getReferralSources();","  const referralSources=(()=>{const co={};requests.forEach(r=>{if(r.referral_source)co[r.referral_source]=(co[r.referral_source]||0)+1;});return Object.entries(co).sort((a,b)=>Number(b[1])-Number(a[1]));})();",1)
open("frontend/app/analytics/page.tsx","w",encoding="utf-8").write(c)
print("Done")
