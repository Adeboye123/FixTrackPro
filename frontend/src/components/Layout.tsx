import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import { motion, AnimatePresence } from "motion/react";

export default function Layout({ user, onLogout }: { user: any; onLogout: () => void }) {
  const location = useLocation();

  useEffect(() => {
    const routeTitles: Record<string, string> = {
      "/": "Dashboard",
      "/repairs": "Repairs",
      "/inventory": "Inventory",
      "/staff": "Staff",
      "/settings": "Settings",
      "/billing": "Billing",
      "/admin": "Super Admin"
    };
    const title = routeTitles[location.pathname] || "FixTrack Pro";
    document.title = `${title} | FixTrack Pro`;
  }, [location]);
  return (
    <div className="flex h-screen bg-[#f8f9fa]">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-8"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
