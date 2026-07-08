import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2 bg-background text-foreground">
      {/* Left — form */}
      <div className="flex min-h-dvh flex-col px-6 py-8 sm:px-10">
        <Link to="/" className="inline-flex items-center gap-2 self-start">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-chart-2 shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">DevConnect</span>
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm animate-slide-up">
            {children}
          </div>
        </div>
        <div className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} DevConnect
        </div>
      </div>

      {/* Right — art */}
      <div className="relative hidden overflow-hidden border-l border-border bg-sidebar lg:block">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div />
          <blockquote className="max-w-md">
            <p className="text-2xl font-medium leading-snug text-gradient">
              "DevConnect is where I actually keep up with people building things I care about."
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">
              — Sarah Chen, Design engineer @ Linear
            </footer>
          </blockquote>
          <div />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
