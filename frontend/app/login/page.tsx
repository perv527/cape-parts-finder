"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (password === "CapeParts2026") {
      localStorage.setItem("admin_logged_in", "true");
      router.push("/admin");
    } else {
      alert("Incorrect password");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Admin Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-4 rounded-xl"
          />

          <button
            type="submit"
            className="w-full bg-black text-white p-4 rounded-xl"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}