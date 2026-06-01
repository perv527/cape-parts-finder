import os
path=r"frontend\app\quotes\[id]\page.tsx"
c=open(path,encoding="utf-8").read()
c=c.replace("text-[24px] font-black text-white","text-[18px] font-black text-white",1)
c=c.replace("text-[24px] font-black\" style={{ color: \"#fb923c\"","text-[18px] font-black\" style={{ color: \"#fb923c\"",1)
c=c.replace("text-[24px] font-black\" style={{ color: \"#4ade80\"","text-[18px] font-black\" style={{ color: \"#4ade80\"",1)
c=c.replace("rounded-xl px-3 py-3 text-[13px] outline-none cursor-pointer text-white col-span-2 lg:col-span-1","w-full rounded-xl px-3 py-2 text-[13px] outline-none cursor-pointer text-white col-span-2",1)
c=c.replace("grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4","grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4",1)
open(path,"w",encoding="utf-8").write(c)
print("Done")
