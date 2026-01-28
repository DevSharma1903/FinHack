import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

  const modules = useMemo(
    () => [
      { title: "Decoder", description: "Get an allocation recommendation from your inputs.", path: "/decoder" },
      { title: "Retirement", description: "Plan your retirement corpus and compare scenarios.", path: "/retirement" },
      { title: "Insurance", description: "Estimate coverage gap and premium impact.", path: "/insurance" },
      { title: "Education", description: "Learn tax basics and investment concepts.", path: "/education" },
      { title: "NPS Schemes", description: "Explore NAV history and compare schemes.", path: "/nps" },
      { title: "Policy", description: "Read policy guidance and references.", path: "/policy" },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <button type="button" className="text-left" onClick={() => navigate("/")}
          >
            <div className="text-sm font-semibold text-foreground">Invest$ure</div>
            <div className="hidden sm:block text-xs text-muted-foreground">Professional financial planning tools</div>
          </button>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            {userEmail ? (
              <>
                <Button type="button" variant="outline" onClick={() => navigate("/app")}>Open app</Button>
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
                <Button type="button" variant="outline" onClick={() => navigate("/login")}>Login</Button>
                <Button type="button" onClick={() => navigate("/signup")}>Sign up</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 md:px-8 py-10">
        <section className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">Your finance toolkit</h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Simulate outcomes, compare scenarios, and make decisions with clarity.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="button" size="lg" onClick={() => navigate(userEmail ? "/app" : "/signup")}>
              {userEmail ? "Open workspace" : "Create account"}
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={() => navigate(userEmail ? "/app" : "/login")}>
              {userEmail ? "Go to app" : "Login"}
            </Button>
          </div>
        </section>

        <section className="mt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((m) => (
              <button
                key={m.path}
                type="button"
                onClick={() => navigate(m.path)}
                className="text-left bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="text-sm font-semibold text-foreground">{m.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{m.description}</div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
