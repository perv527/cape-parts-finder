import os
path=r"frontend\app\quotes\[id]\page.tsx"
c=open(path,encoding="utf-8").read()
i=c.find("DISCLAIMER")
print(repr(c[i:i+400]))
