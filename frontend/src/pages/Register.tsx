import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";

function strength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s; // 0-4
}

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const s = strength(password);
  const labels = ["Too weak", "Weak", "Okay", "Strong", "Excellent"];
  const colors = ["bg-destructive", "bg-destructive", "bg-warning", "bg-primary", "bg-success"];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register(email, password, fullName);
      toast.success("Account created successfully!");
      navigate("/");
    } catch (err: any) {
      console.error("Registration failed", err);
      setError(err.message || "Registration failed. Please try again.");
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight text-gradient">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Join thousands of developers building in public.</p>

      {error && (
        <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="outline"><Github className="mr-2 h-4 w-4" /> GitHub</Button>
        <Button variant="outline"><Mail className="mr-2 h-4 w-4" /> Google</Button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input 
            id="name" 
            required 
            placeholder="Alex Rivera"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
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
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            required 
            autoComplete="new-password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password.length > 0 && (
            <div className="mt-1.5 space-y-1.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded ${i < s ? colors[s] : "bg-border"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{labels[s]}</p>
            </div>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating</> : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="font-medium text-foreground hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
