c=open("frontend/app/sales/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
lines[275]="                        </div>"
lines[276]="                      </div>"
lines[277]="                    </div>"
lines[278]="                  )}"
lines[279]=""
lines[280]=""
lines[281]=""
open("frontend/app/sales/page.tsx","w",encoding="utf-8").write(chr(10).join(lines))
print("Done")
