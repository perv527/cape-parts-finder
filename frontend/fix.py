import os
path=r"frontend\app\quotes\[id]\page.tsx"
c=open(path,encoding="utf-8").read()
c=c.replace("    @media print {\n      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n      .page { padding: 26px 36px; }\n    }","    @media print {\n      @page { size: A4; margin: 0; }\n      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n      html, body { height: 100%; overflow: hidden; }\n      .page { padding: 26px 36px; max-height: 100vh; }\n    }",1)
open(path,"w",encoding="utf-8").write(c)
print("Done:", "@page" in c)
