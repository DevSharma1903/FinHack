import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { DEMO_CREDENTIALS, ensureSeedUsers, getCurrentUser, login } from "@/lib/auth";

type LocationState = {
  from?: string;
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    ensureSeedUsers();
    const user = getCurrentUser();
    if (user) {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  const from = (location.state as LocationState | null)?.from;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <header className="flex items-center justify-between gap-4">
          <button type="button" className="text-left" onClick={() => navigate("/")}> 
            <div className="text-2xl font-semibold tracking-tight gradient-text">FinHack</div>
            <div className="text-sm text-muted-foreground">Sign in to continue</div>
          </button>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-xl border bg-card/40 p-6 md:p-8 glass">
              <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
              <p className="mt-2 text-muted-foreground">
                Use a demo login below or sign in with an account you created locally.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                {DEMO_CREDENTIALS.map((c) => (
                  <button
                    key={c.email}
                    type="button"
                    className="rounded-lg border bg-card/60 p-3 text-left hover:bg-card/80 transition-colors"
                    onClick={() => {
                      setEmail(c.email);
                      setPassword(c.password);
                      toast.message("Demo credentials filled", { description: c.email });
                    }}
                  >
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{c.email}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Password: {c.password}</div>
                  </button>
                ))}
              </div>

              <div className="mt-6 text-sm text-muted-foreground">
                New here?{" "}
                <button type="button" className="text-primary underline" onClick={() => navigate("/signup")}> 
                  Create an account
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your credentials to open the workspace.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    try {
                      const user = login(email, password);
                      toast.success("Signed in", { description: user.email });
                      navigate(from || "/app", { replace: true });
                    } catch (err) {
                      toast.error("Login failed", {
                        description: err instanceof Error ? err.message : "Please check your credentials",
                      });
                    }
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Sign in
                  </Button>

                  <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/")}
                  >
                    Back to landing
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
