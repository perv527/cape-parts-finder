c=open("frontend/app/track/page.tsx",encoding="utf-8").read()
c=c.replace("{`https://wa.me/27696863952?text=","{`https://wa.me/${settings.whatsapp_number}?text=",1)
open("frontend/app/track/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "settings.whatsapp_number" in c)
