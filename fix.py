c=open("frontend/app/admin/page.tsx",encoding="utf-8").read()
c=c.replace("      customer_name: quickSaleModal.customer_name,\n      customer_phone: quickSaleModal.phone_number,\n      part_needed: quickSaleModal.part_needed,\n      selling_price: selling,\n      supplier_price: cost,\n      profit: profit,\n      status: \"Completed\",","      customer_name: quickSaleModal.customer_name,\n      customer_phone: quickSaleModal.phone_number,\n      selling_price: selling,\n      supplier_price: cost,\n      profit: profit,\n      status: \"Completed\",\n      notes: quickSaleModal.part_needed,",1)
open("frontend/app/admin/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "notes: quickSaleModal" in c)
