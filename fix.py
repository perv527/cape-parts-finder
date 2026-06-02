c=open("frontend/app/sales/page.tsx",encoding="utf-8").read()
c=c.replace("{ label: \"Sales\", href: \"/sales\", active: true },\n                { label: \"Analytics\", href: \"/analytics\" },","{ label: \"Sales\", href: \"/sales\", active: true },\n                { label: \"Inventory\", href: \"/inventory\" },\n                { label: \"Analytics\", href: \"/analytics\" },",1)
open("frontend/app/sales/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "/inventory" in c)
