"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/Authcontext";

export default function Login() {
  const { setAuth } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (res.status !== 200 && res.status !== 202) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Invalid credentials");
      }

      const data = await res.json();

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("user_email", email);

      setAuth({
        accessToken: data.access_token,
        userId: data.user_id,
        loggedIn: true,
      });

      setMessage("Login successful. Redirecting...");
      setTimeout(() => router.push("/"), 800);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-black px-6">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Sign in to continue to{" "}
            <span className="text-gray-200 font-medium">CODEmap</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-md bg-black border border-neutral-700 px-4 py-2.5 text-sm
                         text-white placeholder-gray-500
                         focus:outline-none focus:border-white transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md bg-black border border-neutral-700 px-4 py-2.5 text-sm
                         text-white placeholder-gray-500
                         focus:outline-none focus:border-white transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Errors / Messages */}
          {error && (
            <div className="text-sm text-red-400 border border-red-900/40 bg-red-900/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {message && (
            <div className="text-sm text-green-400 border border-green-900/40 bg-green-900/20 rounded-md px-3 py-2">
              {message}
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-white text-black py-2.5 font-semibold
                       hover:bg-gray-200 transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don’t have an account?{" "}
          <span
            onClick={() => router.push("/Signup")}
            className="text-gray-200 cursor-pointer hover:underline"
          >
            Create one
          </span>
        </p>
      </div>
    </main>
  );
}
