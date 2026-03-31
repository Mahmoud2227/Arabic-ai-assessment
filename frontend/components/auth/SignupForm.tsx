"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupFormProps {
  onSignup: (username: string, email: string, password: string) => void;
  onSwitchToLogin: () => void;
  error?: string;
}

const SignupForm = ({ onSignup, onSwitchToLogin, error: externalError }: SignupFormProps) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (error && val === confirmPassword) setError("");
  };

  const handleConfirmChange = (val: string) => {
    setConfirmPassword(val);
    if (error && val === password) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSignup(username, email, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-foreground/80 text-sm">Username</Label>
        <Input id="username" placeholder="johndoe" value={username} onChange={(e) => setUsername(e.target.value)} required className="bg-secondary/50 border-border/50 focus:border-primary h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-foreground/80 text-sm">Email</Label>
        <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-secondary/50 border-border/50 focus:border-primary h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-foreground/80 text-sm">Password</Label>
        <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={(e) => handlePasswordChange(e.target.value)} required className="bg-secondary/50 border-border/50 focus:border-primary h-11" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password" className="text-foreground/80 text-sm">Confirm Password</Label>
        <Input id="confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => handleConfirmChange(e.target.value)} required className="bg-secondary/50 border-border/50 focus:border-primary h-11" />
      </div>
      {(error || externalError) && <p className="mt-1 text-destructive text-sm font-medium">{error || externalError}</p>}
      <Button type="submit" className="w-full h-11 gradient-primary border-0 font-semibold" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchToLogin} className="text-gradient font-medium hover:underline">Sign in</button>
      </p>
    </form>
  );
};

export default SignupForm;
