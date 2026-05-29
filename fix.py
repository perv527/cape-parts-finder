content=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
lines=content.split(chr(10))
bad=lines[376]
idx=bad.index("}}>Follow up</span>}")+len("}}>Follow up</span>}")
lines[376]=bad[:idx]
lines.insert(377,bad[idx:])
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(chr(10).join(lines))
print("Done, lines now:",len(lines))
