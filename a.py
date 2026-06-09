c=open("frontend/app/suppliers/page.tsx",encoding="utf-8").read()
c=c.replace("setRatingModal(supplier); setRating(0); setRatingNote","setRatingModal(supplier); setRatings(0); setRatingNote",1)
open("frontend/app/suppliers/page.tsx","w",encoding="utf-8").write(c)
print("Done")
