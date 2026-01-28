import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DotGridCanvas from "@/components/DotGridCanvas.jsx";
// import { LanguageSelector } from "@/components/LanguageSelector";

const PRIMARY_COLOR = "hsl(217, 84%, 55%)"; // Dark blue/cyan from theme

function useRevealOnce(options = { threshold: 0.2 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        io.disconnect();
      }
    }, options);

    io.observe(el);
    return () => io.disconnect();
  }, [options.threshold]);

  return { ref, visible };
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { ref: dashboardRef, visible: dashboardVisible } = useRevealOnce({ threshold: 0.1 });

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
    <div className="min-h-screen bg-white text-black">
      {/* Header with language selector and login button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-black/5">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="text-left hover:opacity-80 transition-opacity"
            >
              <div className="flex items-baseline" style={{ fontFamily: 'Cinzel, serif' }}>
                <span className="text-2xl font-semibold tracking-tight text-black">I</span>
                <span className="text-xl font-semibold tracking-tight text-black">NVEST</span>
                <span className="text-2xl font-semibold tracking-tight text-black">$</span>
                <span className="text-xl font-semibold tracking-tight text-black">URE</span>
              </div>
              <div className="text-xs text-black font-medium tracking-wider text-center" style={{ fontFamily: 'Cinzel, serif' }}>RETIREMENT & INSURANCE</div>
            </button>
            <div className="flex items-center gap-3">
              {/* <LanguageSelector /> */}
              <button
                onClick={() => navigate("/login")}
                className="rounded-full px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Login
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="rounded-full px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section with dot grid background */}
      <section className="relative min-h-screen overflow-hidden pt-20">
        {/* Dot grid covering left side of screen */}
        <div className="absolute top-0 left-0 bottom-0 w-[40vw] z-0">
          <DotGridCanvas />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-10">
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center" style={{ marginLeft: '40vw' }}>
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight" style={{ fontFamily: 'Cinzel, serif' }}>Invest$ure</h1>
              <p className="mt-4 text-base md:text-lg text-black/70">
                Real time simulations for SIP, FD, RD and retirement planning
              </p>

              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => navigate("/decoder")}
                  className="rounded-full px-6 py-3 text-sm md:text-base font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
          
          {/* Cool auto-scroll down indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center">
            <button
              onClick={() => {
                const dashboardSection = document.getElementById('mini-dashboard');
                if (dashboardSection) {
                  dashboardSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="group cursor-pointer transition-all duration-300 hover:scale-110"
            >
              <div className="relative">
                {/* Arrow shape */}
                <div className="w-12 h-12 flex items-center justify-center">
                  <svg 
                    width="48" 
                    height="48" 
                    viewBox="0 0 48 48" 
                    fill="none" 
                    className="transition-all duration-300 group-hover:scale-110"
                  >
                    <path 
                      d="M24 8L24 40M24 40L16 32M24 40L32 32" 
                      stroke="rgba(55, 120, 255, 0.6)" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="transition-all duration-300 group-hover:stroke-[rgba(55,120,255,0.9)]"
                    />
                  </svg>
                </div>
                {/* Animated dots */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>
                </div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Mini dashboard section - slides in from left on scroll */}
      <section id="mini-dashboard" className="relative z-20 min-h-screen flex items-center justify-center bg-white">
        <div className="mx-auto max-w-4xl px-6 w-full">
          <div
            ref={dashboardRef}
            className={[
              "rounded-2xl border border-black/10 bg-white",
              "transition-all duration-1000 ease-out",
              dashboardVisible 
                ? "opacity-100 translate-x-0" 
                : "opacity-0 translate-x-full",
            ].join(" ")}
          >
            <div className="p-6 md:p-8 text-center">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Cinzel, serif' }}>Financial planning, simplified.</h2>
              <p className="mt-2 text-sm md:text-base text-black/70">
                Run real-time simulations for SIP, RD, FD, retirement planning and insurance coverage.
              </p>
            </div>

            <div className="px-6 md:px-8 pb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cards.map((c) => (
                  <button
                    key={c.title}
                    onClick={() => navigate(c.path)}
                    className={[
                      "group w-full text-left",
                      "rounded-xl border border-black/10 bg-white px-5 py-4",
                      "transition-all duration-200",
                      "hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(55,120,255,0.15)]",
                      "focus:outline-none focus:ring-2 focus:ring-[rgba(55,120,255,0.3)]",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-base font-medium">{c.title}</div>
                      <div className="text-black/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[rgba(55,120,255,0.8)]">→</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-20" />
        </div>
      </section>
    </div>
  );
}
