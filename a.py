c=open("frontend/app/catalogue/page.tsx",encoding="utf-8").read()
print("lines:", len(c.split(chr(10))))
i=c.find("watchlist")
print("has watchlist:", i>0)
