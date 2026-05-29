import base64,os
src="frontend/app/admin/page.tsx"
print("writing",src)
c=open(src,encoding="utf-8").read()
print(len(c.split(chr(10))),"lines")
print(repr(c.split(chr(10))[376]))
