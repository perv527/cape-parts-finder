import os
path=r"frontend\app\quotes\[id]\page.tsx"
c=open(path,encoding="utf-8").read()
old="  <!-- TERMS -->\n  <div class=\"terms\">\n    <div class=\"term\">\n      <div class=\"tdot\" style=\"background:#f97316;\"></div>\n      <div class=\"ttext\">Quote valid until <strong>${expiryDate}</strong></div>\n    </div>\n    <div class=\"term\">\n      <div class=\"tdot\" style=\"background:#22c55e;\"></div>\n      <div class=\"ttext\">Reply <strong>YES</strong> via WhatsApp to confirm</div>\n    </div>\n    <div class=\"term\">\n      <div class=\"tdot\" style=\"background:#3b82f6;\"></div>\n      <div class=\"ttext\">Delivery: <strong>Cape Town &amp; surrounds</strong></div>\n    </div>\n  </div>"
c=c.replace(old,"",1)
c=c.replace("padding: 56px 52px","padding: 36px 44px",1)
c=c.replace(".page { padding: 40px 44px; }",".page { padding: 26px 36px; }",1)
open(path,"w",encoding="utf-8").write(c)
print("Done, terms removed:", "Reply <strong>YES</strong>" not in c)
