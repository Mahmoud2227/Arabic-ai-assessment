"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import Image from "next/image";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();

      // Save for middleware
      document.cookie = `arabic_ai_token=${data.access_token}; path=/; max-age=86400; SameSite=Strict`;
      // Save for api helper
      localStorage.setItem("arabic_ai_token", data.access_token);
      localStorage.setItem("arabic_ai_user", data.user.username);

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  const handleSignup = async (username: string, email: string, password: string) => {
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) throw new Error("Signup failed");
      const data = await res.json();

      document.cookie = `arabic_ai_token=${data.access_token}; path=/; max-age=86400; SameSite=Strict`;
      localStorage.setItem("arabic_ai_token", data.access_token);
      localStorage.setItem("arabic_ai_user", data.user.username);

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 gradient-glow" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <p className="text-muted-foreground text-sm">
            Multimodal AI Chat Platform
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 glow-border">
          <h2 className="text-lg font-semibold text-foreground mb-5">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          {mode === "login" ? (
            <LoginForm
              onLogin={handleLogin}
              onSwitchToSignup={() => { setMode("signup"); setError(""); }}
              error={error}
            />
          ) : (
            <SignupForm
              onSignup={handleSignup}
              onSwitchToLogin={() => { setMode("login"); setError(""); }}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
