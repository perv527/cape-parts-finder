c=open("frontend/app/page.tsx",encoding="utf-8").read()
old="""    setLoading(true);
    try {
      // Upload all photos"""
new="""    setLoading(true);
    try {
      // Check for duplicate active request
      const { data: existing } = await supabase
        .from("parts_requests")
        .select("id, part_needed, created_at, status")
        .eq("phone_number", formData.phone_number)
        .in("status", ["New", "Searching", "Quoted"])
        .order("created_at", { ascending: false })
        .limit(1);
      if (existing && existing.length > 0) {
        const prev = existing[0];
        const date = new Date(prev.created_at).toLocaleDateString("en-ZA");
        const proceed = window.confirm(
          `You already have an active request for "${prev.part_needed}" submitted on ${date} (Status: ${prev.status}).\\n\\nDo you want to submit a new request anyway?`
        );
        if (!proceed) { setLoading(false); return; }
      }
      // Upload all photos"""
c=c.replace(old,new,1)
open("frontend/app/page.tsx","w",encoding="utf-8").write(c)
print("Done:", "duplicate" in c)
