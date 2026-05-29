import os
path=r"frontend\app\quotes\[id]\page.tsx"
c=open(path,encoding="utf-8").read()
i=c.find("All parts sourced")
j=c.find("</div>",i)
newtext="<p>Parts sourced are subject to supplier warranty only. Cape Parts Finder acts as intermediary and accepts no liability for fitment or compatibility issues. Valid for <strong>3 days</strong> from issue date, subject to stock availability.</p>"
c=c[:i]+newtext+c[j:]
open(path,"w",encoding="utf-8").write(c)
print("Done:", "acts as intermediary" in c)
