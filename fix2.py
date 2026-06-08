import os
layout=open("frontend/app/layout.tsx",encoding="utf-8").read()
layout=layout.replace("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes\" />","<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes\" />\n      <meta name=\"theme-color\" content=\"#f97316\" />\n      <meta name=\"apple-mobile-web-app-capable\" content=\"yes\" />\n      <meta name=\"apple-mobile-web-app-title\" content=\"Parts Finder\" />\n      <link rel=\"manifest\" href=\"/manifest.json\" />\n      <link rel=\"apple-touch-icon\" href=\"/icon-192.png\" />",1)
layout=layout.replace("<body style={{overflowX:\"hidden\",maxWidth:\"100vw\"}}>","<body style={{overflowX:\"hidden\",maxWidth:\"100vw\"}}>\n      <script dangerouslySetInnerHTML={{__html: `if(\"serviceWorker\" in navigator){window.addEventListener(\"load\",()=>{navigator.serviceWorker.register(\"/sw.js\").catch(()=>{});})}` }} />",1)
open("frontend/app/layout.tsx","w",encoding="utf-8").write(layout)
print("Layout done:", "manifest" in layout)
