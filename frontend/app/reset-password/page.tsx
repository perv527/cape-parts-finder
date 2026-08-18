"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Recovery links land here with a token in the URL. The Supabase
    // client picks it up automatically and fires PASSWORD_RECOVERY.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Fallback: if a session already exists (e.g. link already consumed
    // in this browser), allow the reset form anyway.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message || "Something went wrong. Please try the reset link again."); return; }
    setSuccess(true);
    setTimeout(() => router.push("/admin"), 1800);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: "#111111" }}>

      {/* Glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-sm" style={{ position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4" style={{ boxShadow: "0 0 32px rgba(249,115,22,0.35)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">Cape Parts Finder</h1>
          <p className="text-gray-500 text-[13px] mt-1">Reset Password</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

          {!ready && !success && (
            <div className="text-center py-4">
              <svg className="animate-spin mx-auto mb-3" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <p className="text-gray-500 text-[13px]">Verifying your reset link...</p>
              <p className="text-gray-600 text-[12px] mt-3">If this doesn't finish in a few seconds, the link may have expired — request a new one from the login page.</p>
            </div>
          )}

          {ready && !success && (
            <>
              {error && (
                <div className="rounded-xl px-4 py-3 mb-4 text-[13px] text-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleReset} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>New Password</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                    className="w-full rounded-xl px-4 py-3 text-[14px] outline-none text-white placeholder-gray-600 transition"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Confirm Password</label>
                  <input type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8}
                    className="w-full rounded-xl px-4 py-3 text-[14px] outline-none text-white placeholder-gray-600 transition"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <p className="text-gray-600 text-[11px]">At least 8 characters.</p>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-[14px] text-white transition cursor-pointer mt-2"
                  style={{ background: loading ? "rgba(249,115,22,0.4)" : "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: loading ? "none" : "0 8px 24px rgba(249,115,22,0.28)" }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Updating...
                    </span>
                  ) : "Set New Password"}
                </button>
              </form>
            </>
          )}

          {success && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p className="text-white font-bold text-[15px] mb-1">Password updated</p>
              <p className="text-gray-500 text-[13px]">Redirecting you to the admin dashboard...</p>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: "rgba(255,255,255,0.15)" }}>
          Cape Parts Finder · Admin Portal · Cape Town
        </p>
      </div>
    </main>
  );
}
