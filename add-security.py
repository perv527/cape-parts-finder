path = "frontend/app/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add sanitize function and honeypot state after imports
old_state = '  const [loading, setLoading] = useState(false);'
new_state = '''  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  function sanitize(val: string) {
    return val.replace(/<[^>]*>/g, "").replace(/[<>\"\';&]/g, "").trim().slice(0, 500);
  }

  function isValidSAPhone(phone: string) {
    const clean = phone.replace(/\s|-/g, "");
    return /^(\+27|27|0)[6-8][0-9]{8}$/.test(clean);
  }'''
c = c.replace(old_state, new_state, 1)

# 2. Add rate limit check and sanitization to handleSubmit
old_submit = '''  async function handleSubmit() {
    setLoading(true);
    try {
      // Duplicate check
      const { data: existing } = await supabase.from("parts_requests").select("id, part_needed, created_at, status")
        .eq("phone_number", formData.phone_number).not("status", "in", "(Delivered,Closed)")
        .order("created_at", { ascending: false }).limit(1);'''

new_submit = '''  async function handleSubmit() {
    // Honeypot check - bots fill hidden fields
    if (honeypot) { setLoading(false); return; }

    // Phone validation
    if (!isValidSAPhone(formData.phone_number)) {
      alert("Please enter a valid South African phone number (e.g. 082 123 4567)");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Rate limiting - max 3 requests per phone per 24 hours
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase.from("parts_requests").select("id")
        .eq("phone_number", formData.phone_number.replace(/\s|-/g, ""))
        .gte("created_at", since);
      if (recent && recent.length >= 3) {
        alert("You have submitted 3 requests in the last 24 hours. Please wait before submitting again.");
        setLoading(false);
        return;
      }

      // Sanitize all inputs
      const sanitized = {
        customer_name: sanitize(formData.customer_name),
        phone_number: formData.phone_number.replace(/[^0-9+\s-]/g, "").trim(),
        email: formData.email.replace(/[^a-zA-Z0-9@._+-]/g, "").trim(),
        area: sanitize(formData.area),
        vehicle_make: sanitize(formData.vehicle_make),
        vehicle_model: sanitize(formData.vehicle_model),
        vehicle_year: formData.vehicle_year.replace(/[^0-9]/g, "").slice(0, 4),
        engine_size: sanitize(formData.engine_size),
        vin_number: formData.vin_number.replace(/[^a-zA-Z0-9]/g, "").slice(0, 17),
        part_needed: sanitize(formData.part_needed),
        part_preference: formData.part_preference,
        extra_details: sanitize(formData.extra_details),
        referral_source: formData.referral_source,
      };

      // Duplicate check
      const { data: existing } = await supabase.from("parts_requests").select("id, part_needed, created_at, status")
        .eq("phone_number", sanitized.phone_number).not("status", "in", "(Delivered,Closed)")
        .order("created_at", { ascending: false }).limit(1);'''

c = c.replace(old_submit, new_submit, 1)

# 3. Replace formData with sanitized in the insert
c = c.replace(
    'const { error } = await supabase.from("parts_requests").insert([{ ...formData, photo_url, photo_urls }]);',
    'const { error } = await supabase.from("parts_requests").insert([{ ...sanitized, photo_url, photo_urls }]);'
, 1)

# 4. Add honeypot field to the form (hidden from users, visible to bots)
old_submit_btn = '                {/* Navigation buttons */}'
new_submit_btn = '''                {/* Honeypot - hidden from real users */}
                <input
                  type="text"
                  name="website_url"
                  value={honeypot}
                  onChange={e => setHoneypot(e.target.value)}
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Navigation buttons */}'''
c = c.replace(old_submit_btn, new_submit_btn, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has honeypot:", "honeypot" in c)
print("has sanitize:", "sanitize" in c)
print("has rate limit:", "Rate limiting" in c)
print("has phone validation:", "isValidSAPhone" in c)
