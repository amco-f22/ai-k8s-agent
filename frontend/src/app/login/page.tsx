"use client";

import { useState } from "react";
import { insforge } from "@/lib/insforge";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        const { data, error: authError } = await insforge.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message || "Failed to log in");
          setLoading(false);
          return;
        }
        
        if (data?.accessToken && data?.user) {
          localStorage.setItem("insforge_token", data.accessToken);
          localStorage.setItem("insforge_user", JSON.stringify(data.user));
        }
      } else {
        const { data, error: authError } = await insforge.auth.signUp({
          email,
          password,
        });

        if (authError) {
          setError(authError.message || "Failed to sign up");
          setLoading(false);
          return;
        }
        
        if (data?.accessToken && data?.user) {
          localStorage.setItem("insforge_token", data.accessToken);
          localStorage.setItem("insforge_user", JSON.stringify(data.user));
        }
      }

      router.push("/dashboard");
    } catch (err) {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />

      <div className="glass-card w-full max-w-md p-8 rounded-2xl z-10 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-slate-400 text-sm">
            {mode === "login"
              ? "Sign in to access your cluster diagnostics."
              : "Sign up to start troubleshooting Kubernetes."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glow-button bg-primary-600 text-white font-semibold py-3 rounded-xl mt-4 transition-all disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}
