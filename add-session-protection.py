import os

# Pages that need session protection
admin_pages = [
    "frontend/app/admin/page.tsx",
    "frontend/app/suppliers/page.tsx",
    "frontend/app/sales/page.tsx",
    "frontend/app/analytics/page.tsx",
    "frontend/app/expenses/page.tsx",
    "frontend/app/reminders/page.tsx",
    "frontend/app/customers/page.tsx",
    "frontend/app/inventory/page.tsx",
    "frontend/app/settings/page.tsx",
    "frontend/app/reviews-admin/page.tsx",
    "frontend/app/quotes/[id]/page.tsx",
]

# Add auth state listener to admin page (main one)
path = "frontend/app/admin/page.tsx"
c = open(path, encoding="utf-8").read()

old_check = '''  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    fetchRequests();
    setAuthChecked(true);
  }'''

new_check = '''  useEffect(() => {
    checkAuth();
    // Listen for auth state changes - auto redirect on session expiry
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    // Refresh session to keep it alive
    await supabase.auth.refreshSession();
    fetchRequests();
    setAuthChecked(true);
  }'''

if old_check in c:
    c = c.replace(old_check, new_check, 1)
    open(path, "w", encoding="utf-8").write(c)
    print("Admin page updated!")
else:
    print("Admin checkAuth not found")

# Add simple session refresh to all other admin pages
for path in admin_pages[1:]:
    if not os.path.exists(path): 
        print(f"Skipping {path} - not found")
        continue
    c = open(path, encoding="utf-8").read()
    
    # Find the getSession call and add refresh
    old = "if (!session) { router.push(\"/login\"); return; }"
    new = "if (!session) { router.push(\"/login\"); return; }\n      await supabase.auth.refreshSession();"
    
    if old in c and "refreshSession" not in c:
        c = c.replace(old, new, 1)
        open(path, "w", encoding="utf-8").write(c)
        print(f"Updated: {path.split('/')[-2]}")
    else:
        print(f"Skipped: {path.split('/')[-2]} (already has it or pattern not found)")

print("\nAll done!")
