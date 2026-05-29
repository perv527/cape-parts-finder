c=open("frontend/app/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
lines[41]="      const {data:ex}=await supabase.from(\"parts_requests\").select(\"id,part_needed,created_at,status\").eq(\"phone_number\",formData.phone_number).neq(\"status\",\"Delivered\").neq(\"status\",\"Closed\").order(\"created_at\",{ascending:false}).limit(1);"
c=chr(10).join(lines)
open("frontend/app/page.tsx","w",encoding="utf-8").write(c)
print("Done")
