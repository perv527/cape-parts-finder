c=open("frontend/app/globals.css",encoding="utf-8").read()
c=c+"body{overflow-x:hidden;max-width:100vw;}\n"
open("frontend/app/globals.css","w",encoding="utf-8").write(c)
print("Done")
