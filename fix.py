import os
path=r"frontend\app\quotes\[id]\page.tsx"
c=open(path,encoding="utf-8").read()
old="    @media print {\n      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n      .page { padding: 26px 36px; }\n    }"
new="    @media print {\n      @page { size: A4; margin: 10mm; }\n      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n      .page { padding: 20px 30px; }\n    }"
c=c.replace(old,new,1)
open(path,"w",encoding="utf-8").write(c)
print("Done:", "@page" in c)
