import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { toast } from "sonner";

export const ResetPassword: React.FC = () => {
  const { resetPassword, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    clearError();
    const hash = location.hash || window.location.hash;
    if (!hash) {
      setTokenError("Invalid or expired recovery link. Please request a new link.");
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const type = params.get("type");

    if (!accessToken || type !== "recovery") {
      setTokenError("Invalid or expired recovery link. Please request a new link.");
      return;
    }

    localStorage.setItem("dc_token", accessToken);
  }, [location]);

  const validate = () => {
    if (!password) {
      setError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    clearError();

    if (tokenError || !validate()) return;

    setLoading(true);
    try {
      await resetPassword(password);
      setSuccess(true);
      toast.success("Access Key updated successfully!");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to reset password.");
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-destructive mb-4">
            {tokenError}
          </div>
          <Button className="w-full" onClick={() => navigate("/login")}>
            Return to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center animate-slide-up">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-border bg-success/10 mb-4">
            <Check className="h-5 w-5 text-success" />
          </div>
          <h1 className="text-xl font-semibold text-gradient">Reset complete</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your password has been updated. You can now log in.</p>
          <div className="mt-6">
            <Button className="w-full" onClick={() => navigate("/login")}>
              Proceed to Login
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight text-gradient">Set new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">Configure a secure password for your profile.</p>

      {(error || authError) && (
        <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-destructive">
          {error || authError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="password">New Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input 
            id="confirm-password" 
            type="password" 
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting</>
          ) : (
            <span className="flex items-center justify-center gap-1">
              Reset Password <ArrowRight size={14} />
            </span>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
