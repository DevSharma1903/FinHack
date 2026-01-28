import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const navigate = useNavigate();

  const cards = useMemo(
    () => [
      { title: "Decoder", path: "/decoder" },
      { title: "Retirement", path: "/retirement" },
      { title: "Insurance", path: "/insurance" },
      { title: "Education", path: "/education" },
      { title: "NPS Schemes", path: "/nps" },
      { title: "Policy", path: "/policy" },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="text-sm font-semibold">Invest$ure</div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => navigate("/login")}>Login</Button>
            <Button type="button" onClick={() => navigate("/signup")}>Sign Up</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 md:px-8 py-10">
        <section className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Invest$ure</h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Real time simulations for SIP, FD, RD and retirement planning.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Button type="button" onClick={() => navigate("/decoder")}>Get started</Button>
            <Button type="button" variant="outline" onClick={() => navigate("/retirement")}>Try retirement planner</Button>
          </div>
        </section>

        <section className="mt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c) => (
              <button
                key={c.path}
                type="button"
                onClick={() => navigate(c.path)}
                className="text-left bg-card border border-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <p className="text-sm font-semibold text-foreground">{c.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">Open module</p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}