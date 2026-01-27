import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BarChart3, Bot, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ensureSeedUsers, getCurrentUser, logout } from "@/lib/auth";

const Landing = () => {
  const navigate = useNavigate();

  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    ensureSeedUsers();
    const user = getCurrentUser();
    setUserEmail(user?.email ?? null);
  }, []);

  const features = useMemo(
    () => [
      {
        title: "Real-time insights",
        description: "Quick simulations and breakdowns so you can make better decisions faster.",
        Icon: BarChart3,
      },
      {
        title: "Investment Planner",
        description: "Plan your investments with ease leveraging ML Models trained on real-world data.",
        Icon: Sparkles,
      },
      {
        title: "AI assisted workflows",
        description: "Use smart helpers to summarize, compare and highlight key risks.",
        Icon: Bot,
      },
      {
        title: "Ethical Finance",
        description: "Blockchain verified hashing of advice & recommendations.",
        Icon: ShieldCheck,
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <header className="flex items-center justify-between gap-4">
          <button type="button" className="text-left" onClick={() => navigate("/")}
          >
            <h1 className="text-3xl font-semibold tracking-tight gradient-text">FinHack</h1>
            <p className="text-sm text-muted-foreground">Build smarter financial decisions with better tools.</p>
          </button>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            {userEmail ? (
              <>
                <Button type="button" variant="outline" onClick={() => navigate("/app")}>
                  Open app
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    logout();
                    setUserEmail(null);
                    toast.success("Logged out");
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button type="button" onClick={() => navigate("/signup")}>
                  Signup
                </Button>
              </>
            )}
          </div>
        </header>

        <main className="mx-auto mt-14 max-w-6xl">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
              Your finance toolkit,
              <span className="gradient-text"> built for speed</span>
            </h2>
            <p className="max-w-3xl text-base md:text-lg text-muted-foreground">
              FinHack helps you simulate outcomes, decode complex documents, and build clarity with modern, AI-assisted workflows.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            {features.map(({ title, description, Icon }) => (
              <div key={title} className="rounded-lg border bg-card/40 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-medium">{title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button type="button" size="lg" onClick={() => navigate(userEmail ? "/app" : "/signup")}>
              {userEmail ? "Open workspace" : "Create free account"}
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={() => navigate(userEmail ? "/app" : "/login")}>
              {userEmail ? "Go to app" : "Login"}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Landing;
