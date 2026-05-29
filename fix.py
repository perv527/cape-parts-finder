import re
c=open("frontend/app/page.tsx",encoding="utf-8").read()
old="    setLoading(true);\n    try {\n      // Upload all photos"
chk="\n      const {data:ex}=await supabase.from(\"parts_requests\").select(\"id,part_needed,created_at,status\").eq(\"phone_number\",formData.phone_number).in(\"status\",[\"New\",\"Searching\",\"Quoted\"]).order(\"created_at\",{ascending:false}).limit(1);\n      if(ex&&ex.length>0){const p=ex[0];const d=new Date(p.created_at).toLocaleDateString(\"en-ZA\");const go=window.confirm(\"You already have an active request for \"+p.part_needed+\" submitted on \"+d+\" (Status: \"+p.status+\"). Submit a new one anyway?\");if(!go){setLoading(false);return;}}"
new="    setLoading(true);\n    try {"+chk+"\n      // Upload all photos"
c=c.replace(old,new,1)
open("frontend/app/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "parts_requests" in c and "existing" not in c and "ex" in c)
