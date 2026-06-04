c=open("frontend/app/quotes/[id]/page.tsx",encoding="utf-8").read()
c=c.replace("  function printQuote(quote: any) {\n    const isStale = !quote.sale_id && (now - new Date(quote.created_at).getTime()) > TWO_DAYS;\n      const daysOld = Math.floor((now - new Date(quote.created_at).getTime()) / 86400000);\n      const quoteNum","  function printQuote(quote: any) {\n      const quoteNum",1)
open("frontend/app/quotes/[id]/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "printQuote(quote: any) {\n      const quoteNum" in c)
