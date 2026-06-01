c=open("frontend/app/sales/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
lines[279]="              </div>"
lines[280]="            );"
lines[281]="          })}"
lines[282]="        </div>"
lines[283]=""
open("frontend/app/sales/page.tsx","w",encoding="utf-8").write(chr(10).join(lines))
print("Done")
