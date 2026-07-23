import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, ShieldCheck, Mail, ArrowRight, RefreshCw, KeyRound } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { toast } from "sonner";

export const VerifyOtpPage: React.FC = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get prefilled email from route state or URL search params
  const initialEmail = location.state?.email || searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleResendOtp = async () => {
    if (!email) {
      setError("Please enter your email address to resend OTP.");
      return;
    }
    setResending(true);
    setError("");
    try {
      await forgotPassword(email);
      toast.success(`A new OTP code has been sent to ${email}!`);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP code.");
      toast.error(err.message || "Failed to resend OTP code.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email address is required.");
      return;
    }
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }
    if (!newPassword) {
      setError("New password is required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, cleanOtp, newPassword);
      setIsSuccess(true);
      toast.success("Password updated successfully! Please log in.");
      navigate("/login");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to verify OTP or reset password.");
      toast.error(err.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="text-center animate-slide-up space-y-4">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">Password Reset Complete!</h1>
          <p className="text-sm text-muted-foreground">
            Your password has been successfully updated. You can now log in using your new credentials.
          </p>
          <div className="pt-2">
            <Button className="w-full" onClick={() => navigate("/login")}>
              Proceed to Sign In <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <ShieldCheck className="h-3.5 w-3.5" /> OTP Verification Page
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-gradient">Verify OTP Code</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the 6-digit OTP code sent to your email along with your new password.
      </p>

      {error && (
        <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Registered Email</Label>
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
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="otp">6-Digit OTP Code</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              className="pl-9 font-mono tracking-[0.3em] text-base font-semibold"
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New Password</Label>
          <Input 
            id="newPassword"
            type="password"
            placeholder="At least 6 characters"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input 
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your new password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying & Resetting...</>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              Verify Code & Reset Password <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Didn't get the code?</span>
        <button 
          type="button" 
          onClick={handleResendOtp}
          disabled={resending}
          className="flex items-center gap-1 font-medium text-primary hover:underline disabled:opacity-50"
        >
          {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Resend OTP
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link to="/login" className="hover:underline">Back to Sign In</Link>
      </p>
    </AuthLayout>
  );
};

export default VerifyOtpPage;
