path = "frontend/app/track/page.tsx"
c = open(path, encoding="utf-8").read()

# Fix the cancelRequest function to use req parameter properly
old_fn = '''  async function cancelRequest(req: any) {
    const canCancel = ["New", "Searching"].includes(req.status || "New");
    if (!canCancel) { alert("Cannot cancel - already quoted or ordered."); return; }
    if (!confirm("Cancel request for " + req.part_needed + "?")) return;
    setCancelling(req.id);
    await supabase.from("parts_requests").update({ status: "Closed" }).eq("id", req.id);
    setCancelling(null);
    setCancelledIds(prev => [...prev, req.id]);
  }'''

# Check if already there
if "cancelRequest(req: any)" not in c:
    # Add it before return (
    old_return = '  return ('
    new_fn_and_return = '''  async function cancelRequest(req: any) {
    const canCancel = ["New", "Searching"].includes(req.status || "New");
    if (!canCancel) { alert("Cannot cancel — already quoted or ordered."); return; }
    if (!confirm("Cancel request for " + req.part_needed + "?")) return;
    setCancelling(req.id);
    await supabase.from("parts_requests").update({ status: "Closed" }).eq("id", req.id);
    setCancelling(null);
    setCancelledIds((prev: number[]) => [...prev, req.id]);
  }

  return ('''
    c = c.replace(old_return, new_fn_and_return, 1)
    print("Added cancelRequest function!")

# Add state if not there
if "cancelledIds" not in c:
    old_state = '  const [cancelling, setCancelling]'
    new_state = '  const [cancelledIds, setCancelledIds] = useState<number[]>([]);\n  const [cancelling, setCancelling]'
    c = c.replace(old_state, new_state, 1)
    print("Added cancelledIds state!")

# Fix cancelling state type
c = c.replace(
    'const [cancelling, setCancelling] = useState<number|null>(null);',
    'const [cancelling, setCancelling] = useState<number|null>(null);',
    1
)

# Add cancel button after WhatsApp CTA
old_wa = '''                    </a>
                  </div>
                </div>
              );
            })}'''

new_wa = '''                    </a>
                    {["New", "Searching"].includes(req.status || "New") && !cancelledIds.includes(req.id) && (
                      <button onClick={() => cancelRequest(req)} disabled={cancelling === req.id}
                        className="w-full py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition mt-2"
                        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                        {cancelling === req.id ? "Cancelling..." : "Cancel Request"}
                      </button>
                    )}
                    {cancelledIds.includes(req.id) && (
                      <div className="w-full py-2.5 rounded-xl text-[13px] text-center mt-2" style={{ background: "rgba(107,114,128,0.08)", color: "#9ca3af" }}>
                        Request cancelled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}'''

if old_wa in c:
    c = c.replace(old_wa, new_wa, 1)
    print("Added cancel button!")
else:
    print("Could not find WhatsApp CTA end")

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has cancelRequest:", "cancelRequest" in c)
print("has cancelledIds:", "cancelledIds" in c)
print("has cancel button:", "Cancel Request" in c)
