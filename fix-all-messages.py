path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

track = "cape-parts-finder.vercel.app/track"
review = "cape-parts-finder.vercel.app/review"

replacements = [
    (
        'searching: `Hi ${name}, just an update - we are actively searching for your ${part} for your ${vehicle}. We have multiple suppliers checking stock right now.\\n\\nCape Parts Finder`,',
        'searching: `Hi ${name}! We are actively searching for your ${part}${vehicle ? " for your " + vehicle : ""} across our supplier network. We will update you shortly.\\n\\nTrack your request: ' + track + '\\n\\nCape Parts Finder`,'
    ),
    (
        'quoted:    `Hi ${name}, great news! We found your ${part} for your ${vehicle}. Please reply and we will send you the price and details.\\n\\nCape Parts Finder`,',
        'quoted:    `Hi ${name}! Great news - we found your ${part}! Please reply and we will send you the price and details right away.\\n\\nTrack your request: ' + track + '\\n\\nCape Parts Finder`,'
    ),
    (
        'ordered:   `Hi ${name}, your ${part} has been ordered and is on its way! We willupdate you once ready for delivery.\\n\\nCape Parts Finder`,',
        'ordered:   `Hi ${name}! Your ${part} has been ordered and is on its way! We will contact you as soon as it is ready for collection or delivery.\\n\\nTrack your request: ' + track + '\\n\\nCape Parts Finder`,'
    ),
    (
        'delivered: `Hi ${name}, your ${part} has been delivered successfully. Thank you for using Cape Parts Finder!\\n\\nCape Parts Finder`,',
        'delivered: `Hi ${name}! Your ${part} has been delivered successfully. We hope everything is perfect!\\n\\nWe would love a quick review: ' + review + '\\n\\nThank you for choosing Cape Parts Finder!`,'
    ),
    (
        'followup:  `Hi ${name}, just checking in on your ${part} request for your ${vehicle}. Can we help you with anything?\\n\\nCape Parts Finder`,',
        'followup:  `Hi ${name}! Just checking in on your ${part} request${vehicle ? " for your " + vehicle : ""}. Are you still looking for this part? We are here to help!\\n\\nCape Parts Finder`,'
    ),
]

for old, new in replacements:
    if old in c:
        c = c.replace(old, new, 1)
        print("Replaced:", old[:50])
    else:
        print("NOT FOUND:", old[:50])

open(path, "w", encoding="utf-8").write(c)
print("\nDone!")
print("has track url:", track in c)
print("has review url:", review in c)
