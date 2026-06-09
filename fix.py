import struct,zlib
def png(size,f):
    w=h=size;r,g,b=249,115,22
    d=b"".join(b"\x00"+bytes([r,g,b]*w) for _ in range(h))
    def c(n,x):return struct.pack(">I",len(x))+n+x+struct.pack(">I",zlib.crc32(n+x)&0xffffffff)
    open(f,"wb").write(b"\x89PNG\r\n\x1a\n"+c(b"IHDR",struct.pack(">IIBBBBB",w,h,8,2,0,0,0))+c(b"IDAT",zlib.compress(d))+c(b"IEND",b""))
    print("Created",f)
png(192,"frontend/public/icon-192.png")
png(512,"frontend/public/icon-512.png")
import json
m=json.load(open("frontend/public/manifest.json"))
m["display"]="standalone"
m["icons"]=[{"src":"/icon-192.png","sizes":"192x192","type":"image/png","purpose":"any maskable"},{"src":"/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]
json.dump(m,open("frontend/public/manifest.json","w"),indent=2)
print("Manifest updated!")
