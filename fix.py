c=open("frontend/app/analytics/page.tsx",encoding="utf-8").read()
c=c.replace("  const referralSources=(()=>{const co={};requests.forEach(r=>{if(r.referral_source)co[r.referral_source]=(co[r.referral_source]||0)+1;});return Object.entries(co).sort((a,b)=>Number(b[1])-Number(a[1]));})();","  const referralSources=(()=>{const co:Record<string,number>={};requests.forEach((r:any)=>{if(r.referral_source)co[r.referral_source]=(co[r.referral_source]||0)+1;});return Object.entries(co).sort((a,b)=>b[1]-a[1]);})();",1)
open("frontend/app/analytics/page.tsx","w",encoding="utf-8").write(c)
print("Done")
