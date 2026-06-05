c=open("frontend/lib/settings.ts",encoding="utf-8").read()
c=c.replace("      cached = { ...DEFAULTS, ...data };\n      return cached;","      cached = { ...DEFAULTS, ...data } as AppSettings;\n      return cached as AppSettings;",1)
open("frontend/lib/settings.ts","w",encoding="utf-8").write(c)
print("Done")
