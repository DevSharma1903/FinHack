import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/i18n/i18n";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Index from "./pages/Index.jsx";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing page: plain white, no theme wrapper */}
          <Route path="/" element={<Landing />} />
          
          {/* Authentication routes */}
          <Route 
            path="/login" 
            element={
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <LanguageProvider>
                  <Login />
                </LanguageProvider>
              </ThemeProvider>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <LanguageProvider>
                  <Signup />
                </LanguageProvider>
              </ThemeProvider>
            } 
          />

          {/* Main app: wrapped in theme + i18n */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                  <LanguageProvider>
                    <Index />
                  </LanguageProvider>
                </ThemeProvider>
              </ProtectedRoute>
            }
          />
          
          {/* Legacy routes for direct access to specific sections */}
          <Route
            path="/decoder"
            element={
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <LanguageProvider>
                  <Index />
                </LanguageProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="/retirement"
            element={
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <LanguageProvider>
                  <Index />
                </LanguageProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="/insurance"
            element={
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <LanguageProvider>
                  <Index />
                </LanguageProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="/education"
            element={
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <LanguageProvider>
                  <Index />
                </LanguageProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="/nps"
            element={
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <LanguageProvider>
                  <Index />
                </LanguageProvider>
              </ThemeProvider>
            }
          />
          <Route
            path="/policy"
            element={
              <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                <LanguageProvider>
                  <Index />
                </LanguageProvider>
              </ThemeProvider>
            }
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;