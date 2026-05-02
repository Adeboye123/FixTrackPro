import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function Layout({ user, onLogout, onUpdate }: { user: any; onLogout: () => void; onUpdate?: (user: any) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

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

  // Subscription sync: check server for latest plan status once on mount
  useEffect(() => {
    if (user?.role === 'admin') return; // Admins don't have subscriptions

    const syncSubscription = async () => {
      try {
        const me = await api.shop.getMe();
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        // If the plan changed (e.g., expired and downgraded), update localStorage
        if (me.plan !== storedUser.plan || me.expiresAt !== storedUser.expiresAt) {
          const updatedUser = { ...storedUser, plan: me.plan, expiresAt: me.expiresAt };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          if (onUpdate) onUpdate(updatedUser);
          
          // If subscription was just expired by the server, show a warning and redirect to billing
          if (me.subscriptionExpired) {
            toastError(`Your ${me.previousPlan} plan has expired. Please subscribe to a new plan.`);
            navigate('/billing');
          } else if (me.plan === 'Free' && location.pathname !== '/billing') {
            // Free plan = previously expired subscription, nudge to billing
            toastError('Your subscription has expired. Please subscribe to continue using all features.');
            navigate('/billing');
          }
        }
      } catch (e) {
        // Silently fail — don't break the app if the sync fails
        console.error("Subscription sync failed:", e);
      }
    };

    syncSubscription();
  }, []); // Only sync once on mount — auth middleware handles expiry on every API call

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
