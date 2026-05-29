import urllib.request
content=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
lines=content.split(chr(10))
print(len(lines),"lines on disk")
