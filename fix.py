import re,sys
c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
c=c.replace("{request.photo_url && (","((request.photo_urls&&request.photo_urls.length>0)||request.photo_url)&&(",1)
c=c.replace("w-32 rounded-xl cursor-pointer","w-24 h-20 object-cover rounded-xl cursor-pointer",1)
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(c)
print("Done")
