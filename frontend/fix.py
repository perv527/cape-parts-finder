c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
c=c.replace("((request.photo_urls&&request.photo_urls.length>0)||request.photo_url)&&(","(request.photo_url||request.photo_urls)&&(",1)
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(c)
print("Done")
