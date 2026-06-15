import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, Shield, BookOpen, Calculator,
  Settings, LogOut, Menu, X, ChevronLeft, User,
} from "lucide-react";
import { AssistantWidget } from "@/components/chat/AssistantWidget";
import { useAuth } from "@/contexts/AuthContext";
import { CryptoSageLogo } from "@/components/CryptoSageLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/format";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { path: "/portfolio", label: "Portfolio", icon: LayoutDashboard },
  { path: "/market", label: "Market", icon: TrendingUp },
  { path: "/defi", label: "DeFi", icon: Shield },
  { path: "/portfolio-journal", label: "Journal", icon: BookOpen },
  { path: "/calculator", label: "Calculator", icon: Calculator },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate("/login"); };
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="relative z-20 hidden flex-shrink-0 flex-col border-r border-sidebar-border/90 bg-sidebar transition-colors duration-300 md:flex dark:border-neon-cyan/12"
        style={{ background: "var(--gradient-sidebar)" }}
      >
        <div className="flex h-16 items-center justify-between gap-2 px-3">
          <Link
            to="/portfolio"
            title="Portfolio"
            className={cn(
              "flex min-w-0 flex-1 items-center rounded-lg py-1 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--sidebar-background))]",
              sidebarOpen ? "justify-start pl-0.5" : "justify-center"
            )}
          >
            {sidebarOpen ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                <CryptoSageLogo variant="full" size={34} />
              </motion.div>
            ) : (
              <CryptoSageLogo variant="icon" size={36} />
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${!sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-2.5 py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                isActive(item.path)
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm dark:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.12)]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              }`}
            >
              <item.icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isActive(item.path) ? "" : "group-hover:scale-105"}`} />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-2.5">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground transition-colors duration-200 hover:bg-sidebar-accent/60 hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            {sidebarOpen && <span>Settings</span>}
          </Link>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-sidebar-border bg-sidebar md:hidden"
            >
              <div className="flex h-16 items-center justify-between gap-2 px-4">
                <Link
                  to="/portfolio"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-w-0 flex-1 items-center rounded-lg py-1 outline-none ring-offset-[hsl(var(--sidebar-background))] transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <CryptoSageLogo variant="full" size={36} wordmarkTone="sidebar" />
                </Link>
                <button type="button" onClick={() => setMobileOpen(false)} className="shrink-0 p-1.5 text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex-1 space-y-1.5 px-2.5 py-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      isActive(item.path)
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Nav */}
        <header className="flex h-16 items-center justify-between border-b border-border/80 bg-card/60 px-4 backdrop-blur-md transition-colors duration-300 dark:border-[hsl(var(--neon-cyan)/0.15)] dark:bg-card/40 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted md:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold text-foreground capitalize tracking-tight">
              {navItems.find((n) => isActive(n.path))?.label || "CryptoSage"}
            </h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden sm:inline">{user?.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-3.5 w-3.5" />Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-3.5 w-3.5" />Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <AssistantWidget />
    </div>
  );
}
