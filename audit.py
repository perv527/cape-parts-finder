import os
for root,dirs,fs in os.walk("frontend/app"):
    dirs[:]=[ d for d in dirs if d not in [".next","node_modules"]]
    for f in fs:
        if f.endswith(".tsx"):
            path=os.path.join(root,f)
            c=open(path,encoding="utf-8").read()
            has_auth="getSession" in c
            page=path.replace("frontend\\\\app\\\\","").replace("\\\\page.tsx","")
            if not has_auth: print("NO AUTH:", page, "- lines:", len(c.split(chr(10))))
