import { useState, useEffect } from "react";
import { LayoutDashboard, Store, CreditCard, History, Bell, Settings, LogOut, ShieldCheck, Wallet } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function AdminSidebar({ user, onLogout }: { user: any; onLogout: () => void }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, path: "/admin" },
    { name: "Shops", icon: Store, path: "/admin/shops" },
    { name: "Subscriptions", icon: CreditCard, path: "/admin/subscriptions" },
    { name: "Wallet", icon: Wallet, path: "/admin/wallet" },
    { name: "Transactions", icon: History, path: "/admin/transactions" },
    { name: "System Logs", icon: Bell, path: "/admin/logs" },
    { name: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  return (
    <div className={cn(
      "bg-[#0f1015] text-slate-300 h-screen flex flex-col border-r border-slate-800 transition-all duration-300 sticky top-0",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn("p-6 border-b border-slate-800", isCollapsed && "px-4 text-center")}>
        <div className="flex items-center gap-3">
            <ShieldAlertIcon isCollapsed={isCollapsed} />
            {!isCollapsed && (
              <div>
                <h1 className="font-bold tracking-tight text-red-500">Super Admin</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">FixTrack Control</p>
              </div>
            )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.name : ""}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
              isCollapsed && "justify-center px-0",
              (location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/admin"))
                ? "bg-red-500/10 text-red-400 font-medium"
                : "hover:bg-slate-800/50 hover:text-white"
            )}
          >
            {location.pathname === item.path && !isCollapsed && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r-full" />
            )}
            <item.icon className={cn("w-5 h-5 shrink-0", 
              (location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== "/admin"))
                ? "text-red-400" 
                : "text-slate-500 group-hover:text-slate-300"
            )} />
            {!isCollapsed && <span className="truncate">{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-[#0a0b0e]">
        <div className={cn("flex items-center gap-3 px-4 py-3 mb-4", isCollapsed && "justify-center px-0")}>
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 shrink-0">
            <span className="text-xs font-bold text-red-400">{user?.name?.[0]}</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">Root Administrator</p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          title={isCollapsed ? "Logout" : ""}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-colors",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}

function ShieldAlertIcon({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className={cn("rounded-xl flex items-center justify-center shrink-0", isCollapsed ? "w-10 h-10 bg-red-500/10" : "w-10 h-10 bg-red-500/10")}>
      <ShieldCheck className="w-6 h-6 text-red-500" />
    </div>
  );
}
