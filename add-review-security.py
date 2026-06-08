path = "frontend/app/review/page.tsx"
c = open(path, encoding="utf-8").read()

# 1. Add captcha state and honeypot
old_state = '  const [loading, setLoading] = useState(false);'
new_state = '''  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha] = useState(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { a, b, answer: a + b };
  });'''
c = c.replace(old_state, new_state, 1)

# 2. Add security checks to handleSubmit
old_submit = '''  async function handleSubmit() {
    if (!rating) { setError("Please select a star rating"); return; }
    if (!form.customer_name.trim()) { setError("Please enter your name");return; }
    setError("");
    setLoading(true);'''
new_submit = '''  async function handleSubmit() {
    if (honeypot) { setLoading(false); return; }
    if (!rating) { setError("Please select a star rating"); return; }
    if (!form.customer_name.trim()) { setError("Please enter your name"); return; }
    if (parseInt(captchaAnswer) !== captcha.answer) { setError("Incorrect answer — please check the maths question"); return; }
    if (form.comment.trim().length > 0 && form.comment.trim().length < 10) { setError("Comment must be at least 10 characters or leave it blank"); return; }

    setError("");
    setLoading(true);

    // Check for duplicate review from same phone
    if (form.phone_number.trim()) {
      const { data: existing } = await supabase.from("reviews").select("id").eq("phone_number", form.phone_number.trim()).limit(1);
      if (existing && existing.length > 0) {
        setError("A review has already been submitted from this number. Thank you!");
        setLoading(false);
        return;
      }
    }'''
c = c.replace(old_submit, new_submit, 1)

# 3. Add captcha field and honeypot to the form, before the submit button
old_btn = '''          {error && <p className="text-[13px] text-red-400 text-center mb-3">{error}</p>}

          <button onClick={handleSubmit}'''
new_btn = '''          {/* Honeypot - hidden from humans */}
          <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)}
            style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

          {/* Math CAPTCHA */}
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <label className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Quick check — what is {captcha.a} + {captcha.b}?
            </label>
            <input type="text" inputMode="numeric" placeholder="Enter your answer"
              value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-[14px] outline-none text-white placeholder-gray-600"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>

          {error && <p className="text-[13px] text-red-400 text-center mb-3">{error}</p>}

          <button onClick={handleSubmit}'''
c = c.replace(old_btn, new_btn, 1)

open(path, "w", encoding="utf-8").write(c)
print("Done!")
print("has captcha:", "captcha" in c)
print("has honeypot:", "honeypot" in c)
print("has duplicate check:", "existing" in c)
