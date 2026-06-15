import { Link, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { CryptoSageLogo } from "@/components/CryptoSageLogo";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            to="/portfolio"
            className="rounded-xl outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <CryptoSageLogo variant="full" size={44} wordmarkTone="theme" />
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Crypto intelligence, simplified</p>
        </div>
        <div className="surface-card p-8 sm:p-9">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
