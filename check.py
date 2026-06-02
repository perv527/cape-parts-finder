pages=["frontend/app/admin/page.tsx","frontend/app/suppliers/page.tsx","frontend/app/sales/page.tsx","frontend/app/analytics/page.tsx","frontend/app/quotes/[id]/page.tsx"]
for p in pages:
    c=open(p,encoding="utf-8").read()
    print(p.split("/")[-2], "- lines:", len(c.split(chr(10))), "| overflow-x-hidden:", "overflow-x-hidden" in c, "| scrollbar-hide:", "scrollbar-hide" in c)
