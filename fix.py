import os
path=r"frontend\app\suppliers\page.tsx"
c=open(path,encoding="utf-8").read()
c=c.replace("w-full max-w-md rounded-2xl overflow-hidden","w-full max-w-md rounded-2xl overflow-hidden mx-4",1)
c=c.replace("fixed inset-0 flex items-center justify-center p-4","fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4",1)
c=c.replace("w-full max-w-sm rounded-2xl overflow-hidden","w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden",1)
open(path,"w",encoding="utf-8").write(c)
print("Done")
