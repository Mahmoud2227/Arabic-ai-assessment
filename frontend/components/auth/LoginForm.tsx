"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToSignup: () => void;
  error?: string;
}

const LoginForm = ({ onLogin, onSwitchToSignup, error }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground/80 text-sm">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-secondary/50 border-border/50 focus:border-primary h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground/80 text-sm">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-secondary/50 border-border/50 focus:border-primary h-11"
        />
      </div>
      {error && <p className="mt-1 text-destructive text-sm font-medium">{error}</p>}
      <Button
        type="submit"
        className="w-full h-11 gradient-primary border-0 font-semibold"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-gradient font-medium hover:underline"
        >
          Sign up
        </button>
      </p>
    </form>
  );
};

export default LoginForm;
