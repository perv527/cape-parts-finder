path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()
i = c.find("const msgs: Record<string, string> = {")
j = c.find("return msgs[status] || null;", i)
end = c.find(chr(10), j) + 1
old = c[i:end]
custom = """    const custom: Record<string, string> = {
      Searching: settings.msg_searching ? settings.msg_searching.replace(/{name}/g, name).replace(/{part}/g, part) : "",
      Quoted: settings.msg_quoted ? settings.msg_quoted.replace(/{name}/g, name).replace(/{part}/g, part) : "",
      Ordered: settings.msg_ordered ? settings.msg_ordered.replace(/{name}/g, name).replace(/{part}/g, part) : "",
      Delivered: settings.msg_delivered ? settings.msg_delivered.replace(/{name}/g, name).replace(/{part}/g, part) : "",
      Closed: settings.msg_followup ? settings.msg_followup.replace(/{name}/g, name).replace(/{part}/g, part) : "",
    };
"""
new = custom + old.replace("return msgs[status] || null;", "return custom[status] || msgs[status] || null;")
c = c[:i] + new + c[end:]
open(path,"w",encoding="utf-8").write(c)
print("Done:", "custom[status]" in c)
