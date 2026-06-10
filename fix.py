import os
files=[]
for root,dirs,fs in os.walk("frontend"):
    dirs[:] = [d for d in dirs if d not in [".next","node_modules"]]
    for f in fs:
        if f.endswith(".tsx") or f.endswith(".ts"):
            files.append(os.path.join(root,f))
count=0
for f in files:
    c=open(f,encoding="utf-8").read()
    if "cape-parts-finder.vercel.app" in c:
        c=c.replace("cape-parts-finder.vercel.app","capepartsfinder.co.za")
        open(f,"w",encoding="utf-8").write(c)
        count+=1
        print("Updated:", f)
print("Total files updated:", count)
