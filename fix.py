c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
lines=c.split(chr(10))
lines[384]=""
lines[385]="                      <svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"rgba(255,255,255,0.3)\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\" style={{ transform: isExpanded ? \"rotate(180deg)\" : \"rotate(0deg)\", transition: \"transform 0.2s\" }}>"
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(chr(10).join(lines))
print("Done")
