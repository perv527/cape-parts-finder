c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
lines[272]="            </div>"
lines[273]=""
lines[274]=""
lines[275]=""
lines[276]=""
lines[277]=""
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(chr(10).join(lines))
print("Done")
