"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const router = useRouter();

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: typeof window !== "undefined" ? window.location.origin + "/reset-password" : undefined,
    });
    setForgotLoading(false);
    if (error) { setError("Something went wrong. Please try again."); return; }
    setForgotSent(true);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/admin");
    }
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
          <p className="text-gray-500 text-[13px] mt-1">Admin Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {error && (
            <div className="rounded-xl px-4 py-3 mb-4 text-[13px] text-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              {error}
            </div>
          )}

          {!forgotMode ? (
            <>
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Email</label>
                  <input type="email" placeholder="admin@capepartsfinder.co.za" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full rounded-xl px-4 py-3 text-[14px] outline-none text-white placeholder-gray-600 transition"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Password</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full rounded-xl px-4 py-3 text-[14px] outline-none text-white placeholder-gray-600 transition"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-[14px] text-white transition cursor-pointer mt-2"
                  style={{ background: loading ? "rgba(249,115,22,0.4)" : "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: loading ? "none" : "0 8px 24px rgba(249,115,22,0.28)" }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Signing in...
                    </span>
                  ) : "Sign In"}
                </button>
              </form>
              <button type="button" onClick={() => { setForgotMode(true); setError(""); setForgotSent(false); setForgotEmail(email); }}
                className="w-full text-center mt-4 text-[12px] cursor-pointer transition" style={{ color: "rgba(255,255,255,0.35)", background: "none", border: "none" }}>
                Forgot password?
              </button>
            </>
          ) : forgotSent ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 6l-10 7L2 6"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
              </div>
              <p className="text-white font-bold text-[14px] mb-1">Check your inbox</p>
              <p className="text-gray-500 text-[13px] mb-4">We sent a password reset link to {forgotEmail}.</p>
              <button type="button" onClick={() => { setForgotMode(false); setForgotSent(false); }}
                className="text-[12px] cursor-pointer transition" style={{ color: "#fb923c", background: "none", border: "none" }}>
                ← Back to sign in
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-500 text-[13px] mb-4">Enter your admin email and we'll send you a link to reset your password.</p>
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Email</label>
                  <input type="email" placeholder="admin@capepartsfinder.co.za" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required
                    className="w-full rounded-xl px-4 py-3 text-[14px] outline-none text-white placeholder-gray-600 transition"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
                <button type="submit" disabled={forgotLoading}
                  className="w-full py-3 rounded-xl font-bold text-[14px] text-white transition cursor-pointer mt-2"
                  style={{ background: forgotLoading ? "rgba(249,115,22,0.4)" : "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: forgotLoading ? "none" : "0 8px 24px rgba(249,115,22,0.28)" }}>
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
              <button type="button" onClick={() => { setForgotMode(false); setError(""); }}
                className="w-full text-center mt-4 text-[12px] cursor-pointer transition" style={{ color: "rgba(255,255,255,0.35)", background: "none", border: "none" }}>
                ← Back to sign in
              </button>
            </>
          )}
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: "rgba(255,255,255,0.15)" }}>
          Cape Parts Finder · Admin Portal · Cape Town
        </p>
      </div>
    </main>
  );
}
