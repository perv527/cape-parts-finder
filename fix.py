c=open("frontend/app/api/send-email/route.ts",encoding="utf-8").read()
c=c.replace("    }\n\n    } else if (type === \"quote_ready\")","\n    } else if (type === \"quote_ready\")",1)
open("frontend/app/api/send-email/route.ts","w",encoding="utf-8").write(c)
print("Done")
