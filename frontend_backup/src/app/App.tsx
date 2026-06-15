import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { DashboardPage } from "../pages/DashboardPage";
import { PortfolioPage } from "../pages/PortfolioPage";
import { DefiPage } from "../pages/DefiPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { MarketPage } from "../pages/MarketPage";
import { MarketCoinPage } from "../pages/MarketCoinPage";
import { DefiProtocolPage } from "../pages/DefiProtocolPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/market/:coinId" element={<MarketCoinPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/defi" element={<DefiPage />} />
          <Route path="/defi/:slug" element={<DefiProtocolPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
