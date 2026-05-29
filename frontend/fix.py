c=open("frontend/app/quotes/[id]/page.tsx",encoding="utf-8").read()
old="""  <!-- TERMS -->
  <div class="terms">
    <div class="term">
      <div class="tdot" style="background:#f97316;"></div>
      <div class="ttext">Quote valid until <strong>${expiryDate}</strong></div>
    </div>
    <div class="term">
      <div class="tdot" style="background:#22c55e;"></div>
      <div class="ttext">Reply <strong>YES</strong> via WhatsApp to confirm</div>
    </div>
    <div class="term">
      <div class="tdot" style="background:#3b82f6;"></div>
      <div class="ttext">Delivery: <strong>Cape Town &amp; surrounds</strong></div>
    </div>
  </div>"""
c=c.replace(old,"",1)
c=c.replace("padding: 56px 52px","padding: 36px 44px",1)
c=c.replace("margin-bottom: 36px; }","margin-bottom: 20px; }",1)
c=c.replace("margin-bottom: 36px; display: flex","margin-bottom: 18px; display: flex",1)
c=c.replace("margin-bottom: 36px; align-items","margin-bottom: 18px; align-items",1)
c=c.replace("margin-bottom: 32px; }","margin-bottom: 16px; }",1)
c=c.replace(".page { padding: 40px 44px; }",".page { padding: 26px 36px; }",1)
open("frontend/app/quotes/[id]/page.tsx","w",encoding="utf-8").write(c)
print("Done")
