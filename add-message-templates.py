path = "frontend/app/settings/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add template fields to form state
old_form = '''    business_name: "Cape Parts Finder",
    owner_name: "",
    whatsapp_number: "27696863952",
    email: "",
    website: "cape-parts-finder.vercel.app",
    address: "",
    bank_name: "First National Bank (FNB)",
    bank_account_name: "Cape Parts Finder",
    bank_account_number: "62863344596",
    bank_account_type: "Savings Account",
    vat_number: "",
    tagline: "Your Trusted Auto Parts Network · Cape Town",'''

new_form = '''    business_name: "Cape Parts Finder",
    owner_name: "",
    whatsapp_number: "27696863952",
    email: "",
    website: "cape-parts-finder.vercel.app",
    address: "",
    bank_name: "First National Bank (FNB)",
    bank_account_name: "Cape Parts Finder",
    bank_account_number: "62863344596",
    bank_account_type: "Savings Account",
    vat_number: "",
    tagline: "Your Trusted Auto Parts Network · Cape Town",
    msg_searching: "",
    msg_quoted: "",
    msg_ordered: "",
    msg_delivered: "",
    msg_followup: "",'''
c = c.replace(old_form, new_form, 1)

# 2. Add template fields to fetchSettings
old_fetch = '''        tagline: data.tagline || "Your Trusted Auto Parts Network · Cape Town",'''
new_fetch = '''        tagline: data.tagline || "Your Trusted Auto Parts Network · Cape Town",
        msg_searching: data.msg_searching || "",
        msg_quoted: data.msg_quoted || "",
        msg_ordered: data.msg_ordered || "",
        msg_delivered: data.msg_delivered || "",
        msg_followup: data.msg_followup || "",'''
c = c.replace(old_fetch, new_fetch, 1)

# 3. Add template fields to saveSettings payload
old_payload = '    const payload = { ...form, updated_at: new Date().toISOString() };'
new_payload = '    const payload = { ...form, updated_at: new Date().toISOString() };'
# Already included via spread

# 4. Add templates section before backup section
old_backup = '        {/* BACKUP SECTION */}'
new_backup = '''        {/* MESSAGE TEMPLATES */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16 }} className="p-5">
          <h2 className="font-bold text-[15px] text-white mb-1">WhatsApp Message Templates</h2>
          <p className="text-[12px] text-gray-500 mb-1">Customise messages sent to customers. Use <span style={{ color: "#fb923c" }}>{"{name}"}</span>, <span style={{ color: "#fb923c" }}>{"{part}"}</span>, <span style={{ color: "#fb923c" }}>{"{vehicle}"}</span> as placeholders.</p>
          <p className="text-[11px] text-gray-600 mb-4">Leave blank to use the default message.</p>
          <div className="space-y-4">
            {[
              { label: "Searching for Part", key: "msg_searching", placeholder: "Hi {name}, we are actively searching for your {part}..." },
              { label: "Quote Ready", key: "msg_quoted", placeholder: "Hi {name}, great news! We have a quote for your {part}..." },
              { label: "Part Ordered", key: "msg_ordered", placeholder: "Hi {name}, your {part} has been ordered..." },
              { label: "Part Delivered", key: "msg_delivered", placeholder: "Hi {name}, your {part} has been delivered..." },
              { label: "Follow Up", key: "msg_followup", placeholder: "Hi {name}, just checking in on your {part} request..." },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                <textarea
                  rows={3}
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form] || ""}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none text-white placeholder-gray-600 resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* BACKUP SECTION */}'''
c = c.replace(old_backup, new_backup, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has msg_searching:", "msg_searching" in c)
print("has templates section:", "Message Templates" in c)
