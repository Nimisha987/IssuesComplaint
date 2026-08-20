"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Signup failed");
      }

      const data = await res.json();

      await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.access_token }),
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="stamp text-civic inline-block mb-4">Staff Access</p>
          <h1 className="font-display text-3xl font-semibold text-ink">Create Account</h1>
          <p className="text-sage text-sm mt-2 font-body">For municipal staff reviewing complaints.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4 bg-panel border-2 border-ink/10 rounded-lg p-6">
          <div>
            <label className="text-sm font-medium text-ink block mb-1">Full name</label>
            <input
              className="w-full border-2 border-ink/10 rounded-md p-3 bg-white focus:border-civic focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink block mb-1">Email</label>
            <input
              type="email"
              className="w-full border-2 border-ink/10 rounded-md p-3 bg-white focus:border-civic focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink block mb-1">Password</label>
            <input
              type="password"
              className="w-full border-2 border-ink/10 rounded-md p-3 bg-white focus:border-civic focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper py-3 rounded-md font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          {error && <p className="text-hazard text-sm text-center">{error}</p>}
        </form>

        <p className="text-center text-xs text-sage mt-6 font-body">
          Already have an account? <a href="/login" className="text-civic hover:underline">Sign in</a>
        </p>
      </div>
    </main>
  );
}