path = "frontend/app/track/page.tsx"
c = open(path, encoding="utf-8").read()

# Find what variable holds the found request
i = c.find("setFound")
if i > 0:
    print("setFound context:", repr(c[i-100:i+200]))
else:
    print("No setFound - searching for request state...")
    # Find the result display
    i2 = c.find("part_needed")
    if i2 > 0:
        print("part_needed context:", repr(c[i2-200:i2+100]))

# Find the cancel button area
i3 = c.find("cancelRequest")
print("cancelRequest count:", c.count("cancelRequest"))

# Find the request variable used in JSX
i4 = c.find("request.status")
if i4 > 0:
    print("request.status context:", repr(c[i4-50:i4+100]))
else:
    i5 = c.find(".status")
    print(".status context:", repr(c[i5-100:i5+100]))
