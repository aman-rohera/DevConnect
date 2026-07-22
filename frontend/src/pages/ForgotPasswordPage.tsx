import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Mail, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { toast } from "sonner";

export const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await forgotPassword(email);
      if (res?.simulated) {
        toast.warning("SMTP credentials missing in backend/.env. Configure GMAIL_USER & GMAIL_APP_PASS to receive live emails.");
      } else {
        toast.success(`OTP code sent to ${email}! Check your inbox.`);
      }
      // Navigate to dedicated Verify OTP page
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`, { state: { email } });
    } catch (err: any) {
      console.error("Forgot password request failed", err);
      setError(err.message || "Failed to send OTP code.");
      toast.error(err.message || "Failed to send OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <KeyRound className="h-3.5 w-3.5" /> Request Password Reset OTP
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-gradient">Forgot Password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your registered email address below. We'll send a 6-digit OTP verification code to your inbox using Nodemailer.
      </p>

      {error && (
        <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Registered Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="email" 
              type="email" 
              required 
              autoComplete="email" 
              placeholder="you@developer.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP Email...</>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              Send OTP Code <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered your password? <Link to="/login" className="font-medium text-foreground hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
