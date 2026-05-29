c=open("frontend/app/page.tsx",encoding="utf-8").read()
old="      const {data:ex}=await supabase.from(\"parts_requests\").select(\"id,part_needed,created_at,status\").eq(\"phone_number\",formData.phone_number).in(\"status\",[\"New\",\"Searching\",\"Quoted\"]).order(\"created_at\",{ascending:false}).limit(1);"
new="      const {data:ex}=await supabase.from(\"parts_requests\").select(\"id,part_needed,created_at,status\").eq(\"phone_number\",formData.phone_number).not(\"status\",\"in\",(\"Delivered,Closed\")).order(\"created_at\",{ascending:false}).limit(1);"
c=c.replace(old,new,1)
open("frontend/app/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "not(" in c)
