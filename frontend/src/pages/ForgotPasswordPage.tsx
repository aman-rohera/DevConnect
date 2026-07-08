import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { toast } from "sonner";

export const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await forgotPassword(email);
      setSent(true);
      toast.success("Password reset email sent!");
    } catch (err: any) {
      console.error("Forgot password request failed", err);
      setError(err.message || "Failed to send reset link.");
      toast.error(err.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-border bg-success/10 mb-4">
            <Check className="h-5 w-5 text-success" />
          </div>
          <h1 className="text-xl font-semibold text-gradient">Check your email</h1>
          <p className="mt-1 text-sm text-muted-foreground">We sent a password reset link. It expires in 30 minutes.</p>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight text-gradient">Reset password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>

      {error && (
        <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            required 
            autoComplete="email" 
            placeholder="you@developer.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending</> : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it? <Link to="/login" className="font-medium text-foreground hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
