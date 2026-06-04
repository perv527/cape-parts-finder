path = "frontend/app/suppliers/page.tsx"
c = open(path, encoding="utf-8").read()

# Find the Add Supplier button and add Performance button after it
old = """              Add Supplier
            </button>"""

new = """              Add Supplier
            </button>
            <button onClick={() => setShowPerf(!showPerf)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition"
              style={showPerf
                ? { background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
              Performance
            </button>"""

c = c.replace(old, new, 1)
open(path, "w", encoding="utf-8").write(c)
print("Done:", "Performance" in c and "setShowPerf" in c)
