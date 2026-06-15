import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { TickerBar } from "../components/layout/TickerBar.tsx";
import { useAuth } from "../features/auth/useAuth";
import { ChatPanel } from "../features/chat/ChatPanel";

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm md:text-base font-medium transition-all duration-200 ${
    isActive
      ? "bg-quantix.card text-quantix.text shadow-quantix-card"
      : "text-quantix.muted hover:bg-quantix.card/80 hover:text-quantix.text hover:-translate-y-0.5 hover:shadow-lg"
  }`;

const routes = [
  { to: "/", label: "Crypto Dashboard" },
  { to: "/market", label: "Market Explorer" },
  { to: "/defi", label: "DeFi Dashboard" },
  { to: "/portfolio", label: "Portfolio" },
];

function getRouteLabel(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  const match = routes.find((r) => r.to === pathname);
  if (match) return match.label;
  return pathname.replace("/", "") || "Unknown";
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-quantix.bg text-quantix.text">
      {/* Sidebar */}
      <aside className="flex w-56 md:w-128 flex-col border-r border-quantix.border bg-quantix.surface/80 px-4 py-5">
        <div className="mb-6 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-quantix.primary to-quantix.green" />
          <div>
            <div className="font-heading text-xl tracking-tight">CryptoSage</div>
            <div className="text-xs md:text-sm text-quantix.muted">AI Crypto Literacy Suite</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 text-sm">
          {routes.map((r) => (
            <NavLink key={r.to} to={r.to} className={navItemClass} end={r.to === "/"}>
              <span>{r.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-quantix.border/70 bg-quantix.card/60 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-quantix.muted">Signed in</div>
          <div className="mt-2 text-sm font-semibold text-quantix.text">{user?.name}</div>
          <div className="text-xs text-quantix.muted">{user?.email}</div>
          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="mt-4 w-full rounded-md border border-quantix.border/70 px-3 py-2 text-xs md:text-sm text-quantix.muted hover:border-red-500 hover:text-red-400"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1">
        {/* Top nav */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-quantix.border bg-quantix.surface/80 px-4 md:px-6">
            <div className="font-heading text-base md:text-lg uppercase tracking-[0.18em] text-quantix.muted">
              {getRouteLabel(location.pathname)}
            </div>
            <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-quantix.muted">
              <div className="rounded-full border border-quantix.border/70 px-3 py-1.5">
                Live education-first crypto workspace
              </div>
            </div>
          </header>

          <TickerBar />

          <main className="flex flex-1 flex-col overflow-y-auto px-3 pb-4 pt-3 md:px-4">
            <Outlet />
          </main>
        </div>

        <aside className="hidden w-[24rem] shrink-0 border-l border-quantix.border bg-quantix.surface/70 p-3 xl:block">
          <ChatPanel />
        </aside>
      </div>
    </div>
  );
}
