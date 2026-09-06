import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { cryptoSageFaviconSvg } from "@/components/CryptoSageLogo";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/contexts/SessionContext";
import { AssistantChatProvider } from "@/contexts/AssistantChatContext";
import { SessionGate } from "@/components/session/SessionGate";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import LoginPage from "@/pages/Login";
import SignupPage from "@/pages/Signup";
import PortfolioPage from "@/pages/Portfolio";
import MarketPage from "@/pages/Market";
import DefiPage from "@/pages/Defi";
import PortfolioJournalPage from "@/pages/PortfolioJournal";
import CalculatorPage from "@/pages/Calculator";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const link =
      document.querySelector<HTMLLinkElement>("link[rel='icon']") || document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = `data:image/svg+xml,${encodeURIComponent(cryptoSageFaviconSvg)}`;
    document.head.appendChild(link);
    document.title = "CryptoSage";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <SessionProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Route>

              <Route
                element={
                  <SessionGate>
                    <AssistantChatProvider>
                      <AppLayout />
                    </AssistantChatProvider>
                  </SessionGate>
                }
              >
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/market" element={<MarketPage />} />
                <Route path="/defi" element={<DefiPage />} />
                <Route path="/portfolio-journal" element={<PortfolioJournalPage />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="/" element={<Navigate to="/portfolio" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SessionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
