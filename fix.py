c=open("frontend/app/sales/page.tsx",encoding="utf-8").read()
start=c.find("  function printSaleInvoice")
end=c.find("  function exportToCSV")
c=c[:start]+c[end:]
c=c.replace("                      <button onClick={() => printSaleInvoice(sale)}","")
open("frontend/app/sales/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "printSaleInvoice" not in c)
