import os
path=r"frontend\app\quotes\[id]\page.tsx"
c=open(path,encoding="utf-8").read()
# Fix 2-page issue - shorten disclaimer
c=c.replace("    <p>All parts sourced are subject to the <strong>manufacturer's or supplier's warranty</strong> only. Cape Parts Finder acts solely as an intermediary between the customer and supplier. The applicable guarantee and warranty terms are as provided by the supplying party and Cape Parts Finder accepts no responsibility beyond that warranty.</p>\n    <p>Cape Parts Finder accepts no liability for parts incompatibility, fitment issues, or any damage arising from incorrect installation. It is the customer's sole responsibility to verify part compatibility with their vehicle prior to fitment.</p>\n    <p>This quotation is valid for <strong>3 days</strong> from the date of issue and is subject to stock availability at time of order confirmation. This document does not constitute a binding agreement until full payment has been received and confirmed by Cape Parts Finder.</p>","    <p>Parts are subject to supplier warranty only. Cape Parts Finder acts as intermediary and accepts no liability for compatibility or fitment. Valid <strong>3 days</strong> from issue. Subject to stock availability. Not binding until payment confirmed.</p>",1)
open(path,"w",encoding="utf-8").write(c)
print("Done:", "Not binding" in c)
