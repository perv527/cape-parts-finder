const fs = require("fs");
let c = fs.readFileSync("frontend/app/admin/page.tsx", "utf8");
const oldPhoto = `{request.photo_url && (
                        <div className="px-4 pb-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Photo</p>
                          <img src={request.photo_url} alt="Uploaded" className="w-32 rounded-xl cursor-pointer" style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                            onClick={() => window.open(request.photo_url)} />
                        </div>
                      )}`;
const newPhoto = `{((request.photo_urls && request.photo_urls.length > 0) || request.photo_url) && (
                        <div className="px-4 pb-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Photos</p>
                          <div className="flex gap-2 flex-wrap">
                            {(request.photo_urls && request.photo_urls.length > 0 ? request.photo_urls : [request.photo_url]).map((url, i) => (
                              <img key={i} src={url} alt={"Photo "+(i+1)} className="w-24 h-20 object-cover rounded-xl cursor-pointer"
                                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                                onClick={() => window.open(url)} />
                            ))}
                          </div>
                        </div>
                      )}`;
c = c.replace(oldPhoto, newPhoto);
fs.writeFileSync("frontend/app/admin/page.tsx", c, "utf8");
console.log("Done - photo_urls:", c.includes("photo_urls"));
