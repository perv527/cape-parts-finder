path = r"frontend/app/quotes/[id]/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add getNextInvoiceNumber and getNextQuoteNumber functions before printQuote
old_print = '  function printQuote(quote: any) {'
new_print = '''  async function getNextNumber(type: "invoice" | "quote") {
    const { data } = await supabase.from("invoice_counter").select("*").eq("id", 1).single();
    const current = data || { last_invoice_number: 0, last_quote_number: 0 };
    if (type === "invoice") {
      const next = (current.last_invoice_number || 0) + 1;
      await supabase.from("invoice_counter").update({ last_invoice_number: next, updated_at: new Date().toISOString() }).eq("id", 1);
      return "INV-" + String(next).padStart(4, "0");
    } else {
      const next = (current.last_quote_number || 0) + 1;
      await supabase.from("invoice_counter").update({ last_quote_number: next, updated_at: new Date().toISOString() }).eq("id", 1);
      return "QUO-" + String(next).padStart(4, "0");
    }
  }

  function printQuote(quote: any) {'''
c = c.replace(old_print, new_print, 1)

# 2. Make printQuote async and use getNextNumber
old_quote_num = '''  function printQuote(quote: any) {
    const quoteNum = `CPF-${String(request.id).padStart(4, "0")}-${String(quote.id).padStart(4, "0")}`;'''
new_quote_num = '''  async function printQuote(quote: any) {
    const quoteNum = await getNextNumber("quote");'''
c = c.replace(old_quote_num, new_quote_num, 1)

# 3. Make printInvoice async and use getNextNumber
old_inv = '''  function printInvoice(quote: any) {
    const invNum = "INV-" + String(request.id).padStart(4, "0") + "-" + String(quote.id).padStart(4, "0");'''
new_inv = '''  async function printInvoice(quote: any) {
    const invNum = await getNextNumber("invoice");'''
c = c.replace(old_inv, new_inv, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has getNextNumber:", "getNextNumber" in c)
print("has async printQuote:", "async function printQuote" in c)
print("has async printInvoice:", "async function printInvoice" in c)

# Also fix sales page
import os
sales_path = "frontend/app/sales/page.tsx"
if os.path.exists(sales_path):
    s = open(sales_path, encoding="utf-8").read()
    
    # Add getNextNumber to sales page
    old_sales_fn = '  function printInvoice(sale: any) {'
    new_sales_fn = '''  async function getNextInvoiceNum() {
    const { data } = await supabase.from("invoice_counter").select("*").eq("id", 1).single();
    const next = ((data?.last_invoice_number) || 0) + 1;
    await supabase.from("invoice_counter").update({ last_invoice_number: next, updated_at: new Date().toISOString() }).eq("id", 1);
    return "INV-" + String(next).padStart(4, "0");
  }

  async function printInvoice(sale: any) {'''
    s = s.replace(old_sales_fn, new_sales_fn, 1)
    
    # Make it use the new number
    old_inv_num = '    const invNum = "INV-SALE-" + String(sale.id).padStart(4, "0");'
    new_inv_num = '    const invNum = await getNextInvoiceNum();'
    s = s.replace(old_inv_num, new_inv_num, 1)
    
    open(sales_path, "w", encoding="utf-8").write(s)
    print("Sales page updated!")
    print("has getNextInvoiceNum:", "getNextInvoiceNum" in s)
