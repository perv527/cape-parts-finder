path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

old_msgs = '''const msgs: Record<string, string> = {
      Searching: `Hi ${name}, we are nowactively searching for your ${part} for your ${vehicle}. We will update you shortly.\\n\\nCape Parts Finder`,
      Quoted:    `Hi ${name}, great news! We have a quote ready for your ${part}. Please reply and we will send you the details.\\n\\nCape Parts Finder`,
      Ordered:   `Hi ${name}, your ${part} has been ordered! We will let you know once it is ready.\\n\\nCape Parts Finder`,
      Delivered: `Hi ${name}, your ${part} has been delivered. Thank you for choosing Cape Parts Finder!\\n\\nCape Parts Finder`,
      Closed:    `Hi ${name}, your request for a ${part} has been completed. Thank you!\\n\\nCape Parts Finder`,
    };
    returnmsgs[status] || null;'''

new_msgs = '''const trackUrl = "cape-parts-finder.vercel.app/track";
    const msgs: Record<string, string> = {
      Searching: `Hi ${name}! We have received your request for a ${part}${vehicle ? " for your " + vehicle : ""} and we are now actively searching our supplier network. We will update you as soon as we have information.\\n\\nTrack your request: ${trackUrl}\\n\\nCape Parts Finder`,
      Quoted:    `Hi ${name}! Great news - we have found your ${part}${vehicle ? " for your " + vehicle : ""}! Please reply to this message and we will send you the price and details right away.\\n\\nTrack your request: ${trackUrl}\\n\\nCape Parts Finder`,
      Ordered:   `Hi ${name}! Your ${part} has been ordered and is on its way. We will contact you as soon as it is ready for collection or delivery.\\n\\nTrack your request: ${trackUrl}\\n\\nCape Parts Finder`,
      Delivered: `Hi ${name}! Your ${part} has been delivered successfully. We hope everything is perfect!\\n\\nThank you for choosing Cape Parts Finder - we appreciate your business and look forward to helping you again.\\n\\nLeave us a review: cape-parts-finder.vercel.app/review\\n\\nCape Parts Finder`,
      Closed:    `Hi ${name}! Your request for a ${part} has been completed. Thank you for using Cape Parts Finder!\\n\\nWe would love to hear your feedback: cape-parts-finder.vercel.app/review\\n\\nCape Parts Finder`,
    };
    return msgs[status] || null;'''

c = c.replace(old_msgs, new_msgs, 1)
open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has trackUrl:", "trackUrl" in c)
print("has review link:", "review" in c)
