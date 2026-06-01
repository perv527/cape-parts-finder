c=open("frontend/app/page.tsx",encoding="utf-8").read()
c=c.replace("<select name=\"referral_source\" value={formData.referral_source} onChange={handleChange}\n                    className={inputClass} style={inputStyle}>","<select name=\"referral_source\" value={formData.referral_source} onChange={handleChange}\n                    className={inputClass} style={{...inputStyle, color: formData.referral_source ? \"white\" : \"#4b5563\"}}>",1)
open("frontend/app/page.tsx","w",encoding="utf-8").write(c)
print("Done")
