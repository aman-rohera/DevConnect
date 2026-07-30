import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate("/");
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || "Invalid email or password.");
      toast.error(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setError(err);
      toast.error(err);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000/api' : 'https://devconnect-11qm.onrender.com/api');
    window.location.href = `${backendUrl}/auth/google`;
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold tracking-tight text-gradient">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back to DevConnect.</p>

      {error && (
        <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="outline"><Github className="mr-2 h-4 w-4" /> GitHub</Button>
        <Button variant="outline" type="button" onClick={handleGoogleLogin}><Mail className="mr-2 h-4 w-4" /> Google</Button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="you@developer.com" 
            required 
            autoComplete="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot Password?</Link>
          </div>
          <Input 
            id="password" 
            type="password" 
            required 
            autoComplete="current-password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in</> : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account? <Link to="/register" className="font-medium text-foreground hover:underline">Create one</Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
