c=open("frontend/app/globals.css",encoding="utf-8").read()
extra="\n.scrollbar-hide::-webkit-scrollbar{display:none;}\n.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none;}\n*{-webkit-tap-highlight-color:transparent;}\n@media(max-width:640px){input,select,textarea,button{font-size:16px!important;}}"
open("frontend/app/globals.css","w",encoding="utf-8").write(c+extra)
print("Done")
