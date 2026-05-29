import os
path=r"frontend\app\quotes\[id]\page.tsx"
c=open(path,encoding="utf-8").read()
c=c.replace("Cape Parts Finder accepts no liability","Valid for 3 days only.",1)
open(path,"w",encoding="utf-8").write(c)
print("Done")
print("Done")
