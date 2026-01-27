import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ensureSeedUsers, getCurrentUser, signup } from "@/lib/auth";

const Signup = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    ensureSeedUsers();
    const user = getCurrentUser();
    if (user) {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <header className="flex items-center justify-between gap-4">
          <button type="button" className="text-left" onClick={() => navigate("/")}> 
            <div className="text-2xl font-semibold tracking-tight gradient-text">FinHack</div>
            <div className="text-sm text-muted-foreground">Create your account</div>
          </button>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-xl border bg-card/40 p-6 md:p-8 glass">
              <h1 className="text-3xl font-semibold tracking-tight">Get started with FinHack</h1>
              <p className="mt-2 text-muted-foreground">
                Create an account locally (stored in your browser). You can always use demo accounts too.
              </p>

              <div className="mt-6 text-sm text-muted-foreground">
                Already have an account?{" "}
                <button type="button" className="text-primary underline" onClick={() => navigate("/login")}> 
                  Sign in
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle>Signup</CardTitle>
                <CardDescription>Create a local account and jump into the workspace.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    try {
                      const user = signup(name, email, password);
                      toast.success("Account created", { description: user.email });
                      navigate("/app", { replace: true });
                    } catch (err) {
                      toast.error("Signup failed", {
                        description: err instanceof Error ? err.message : "Please check your details",
                      });
                    }
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </div>

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
                      placeholder="Create a password"
                      autoComplete="new-password"
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Create account
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

export default Signup;
