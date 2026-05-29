import os
path=r"frontend\app\quotes\[id]\page.tsx"
c=open(path,encoding="utf-8").read()
inv="""  function printInvoice(quote) {
    const invNum = "INV-"+String(request.id).padStart(4,"0")+"-"+String(quote.id).padStart(4,"0");
    const date = new Date().toLocaleDateString("en-ZA",{day:"numeric",month:"long",year:"numeric"});
    const base = Number(quote.marked_up_price);
    const vat = base*0.15;
    const total = base+vat;
    const html = printInvoiceHTML(invNum,date,base,vat,total,quote);
    const win=window.open("","_blank");
    if(!win){alert("Allow popups to print");return;}
    win.document.write(html);win.document.close();win.onload=()=>{win.focus();win.print();}
  }"""
c=c.replace("  function printQuote(quote: any) {",inv+"\n\n  function printQuote(quote: any) {",1)
open(path,"w",encoding="utf-8").write(c)
print("Done:", "printInvoice" in c)
