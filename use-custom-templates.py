path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

# Replace the getStatusMessage function to check settings first
old_msgs = '''    const msgs: Record<string, string> = {
      Searching: `Hi ${name}! We are actively searching for your ${part}${vehicle ? " for your " + vehicle : ""} across our supplier network. We will update you shortly.\\n\\nTrack your request: cape-parts-finder.vercel.app/track\\n\\nCape Parts Finder`,
      Quoted:    `Hi ${name}! Great news - we found your ${part}! Please reply and we will send you the price and details right away.\\n\\nTrack your request: cape-parts-finder.vercel.app/track\\n\\nCape Parts Finder`,
      Ordered:   `Hi ${name}! Your ${part} has been ordered and is on its way! We will contact you as soon as it is ready for collection or delivery.\\n\\nTrack your request: cape-parts-finder.vercel.app/track\\n\\nCape Parts Finder`,
      Delivered: `Hi ${name}! Your ${part} has been delivered successfully. We hope everything is perfect!\\n\\nWe would love a quick review: cape-parts-finder.vercel.app/review\\n\\nThank you for choosing Cape Parts Finder!`,
      Closed:    `Hi ${name}! Your request for a ${part} has been completed. Thank you for using Cape Parts Finder!\\n\\nWe would love to hear your feedback: cape-parts-finder.vercel.app/review\\n\\nCape Parts Finder`,
    };
    return msgs[status] || null;'''

new_msgs = '''    const custom: Record<string, string> = {
      Searching: settings.msg_searching || "",
      Quoted:    settings.msg_quoted || "",
      Ordered:   settings.msg_ordered || "",
      Delivered: settings.msg_delivered || "",
      Closed:    settings.msg_followup || "",
    };

    function applyVars(template: string) {
      return template.replace(/\{name\}/g, name).replace(/\{part\}/g, part).replace(/\{vehicle\}/g, vehicle);
    }

    const defaults: Record<string, string> = {
      Searching: `Hi ${name}! We are actively searching for your ${part}${vehicle ? " for your " + vehicle : ""} across our supplier network. We will update you shortly.\\n\\nTrack your request: cape-parts-finder.vercel.app/track\\n\\nCape Parts Finder`,
      Quoted:    `Hi ${name}! Great news - we found your ${part}! Please reply and we will send you the price and details right away.\\n\\nTrack your request: cape-parts-finder.vercel.app/track\\n\\nCape Parts Finder`,
      Ordered:   `Hi ${name}! Your ${part} has been ordered and is on its way! We will contact you as soon as it is ready.\\n\\nTrack your request: cape-parts-finder.vercel.app/track\\n\\nCape Parts Finder`,
      Delivered: `Hi ${name}! Your ${part} has been delivered successfully. We hope everything is perfect!\\n\\nLeave us a review: cape-parts-finder.vercel.app/review\\n\\nCape Parts Finder`,
      Closed:    `Hi ${name}! Your request for a ${part} has been completed. Thank you!\\n\\nWe would love your feedback: cape-parts-finder.vercel.app/review\\n\\nCape Parts Finder`,
    };

    const msg = custom[status] ? applyVars(custom[status]) : (defaults[status] || null);
    return msg;'''

c = c.replace(old_msgs, new_msgs, 1)
open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has applyVars:", "applyVars" in c)
print("has custom templates:", "settings.msg_searching" in c)
