import { useState, useEffect } from "react";
import { LayoutDashboard, Wrench, Users, Settings, CreditCard, LogOut, Store, Lock, Package, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { hasFeature } from "../config/planConfig";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar({ user, onLogout }: { user: any; onLogout: () => void }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const currentPlan = user?.plan || 'Trial';

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
        setIsMobileOpen(false);
      } else {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", locked: false },
    { name: "Repairs", icon: Wrench, path: "/repairs", locked: false },
    { name: "Inventory", icon: Store, path: "/inventory", locked: !hasFeature(currentPlan, 'inventory'), requiredPlan: "Basic" },
    { name: "Staff", icon: Users, path: "/staff", locked: false },
    { name: "Billing", icon: CreditCard, path: "/billing", locked: false },
    { name: "Settings", icon: Settings, path: "/settings", locked: false },
  ];

  // Plan badge colors
  const planColors: Record<string, string> = {
    Trial: "bg-slate-500/20 text-slate-400",
    Free: "bg-slate-500/20 text-slate-400",
    Basic: "bg-emerald-500/20 text-emerald-400",
    Pro: "bg-indigo-500/20 text-indigo-400",
    Premium: "bg-amber-500/20 text-amber-400",
  };

  const sidebarContent = (
    <>
      {/* Brand Header with Shop Logo */}
      <div className={cn("p-6 border-b border-white/5", isCollapsed && !isMobileOpen && "px-4 text-center")}>
        <div className={cn("flex items-center gap-3", isCollapsed && !isMobileOpen && "justify-center")}>
          {user?.logoUrl ? (
            <img 
              src={user.logoUrl} 
              alt={user?.name || "Shop Logo"} 
              className={cn(
                "rounded-xl object-contain bg-white/10 border border-white/10",
                isCollapsed && !isMobileOpen ? "w-10 h-10" : "w-9 h-9"
              )}
            />
          ) : (
            <div className={cn(
              "bg-indigo-600 rounded-xl flex items-center justify-center shrink-0",
              isCollapsed && !isMobileOpen ? "w-10 h-10" : "w-9 h-9"
            )}>
              <Wrench className="w-5 h-5 text-white" />
            </div>
          )}
          {(!isCollapsed || isMobileOpen) && (
            <div className="min-w-0">
              <h1 className="font-bold tracking-tight text-white text-sm truncate">
                {user?.name || "FixTrack Pro"}
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono truncate">
                Specialist Tool
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.locked ? "/billing" : item.path}
            title={isCollapsed && !isMobileOpen ? (item.locked ? `${item.name} (${item.requiredPlan}+ required)` : item.name) : ""}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
              isCollapsed && !isMobileOpen && "justify-center px-0",
              item.locked 
                ? "text-slate-600 hover:bg-white/5 cursor-pointer"
                : location.pathname === item.path
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5 shrink-0", 
              item.locked ? "text-slate-600" :
              location.pathname === item.path ? "text-white" : "text-slate-500 group-hover:text-white"
            )} />
            {(!isCollapsed || isMobileOpen) && (
              <span className={cn("font-medium truncate flex-1", item.locked && "text-slate-600")}>
                {item.name}
              </span>
            )}
            {(!isCollapsed || isMobileOpen) && item.locked && (
              <Lock className="w-3.5 h-3.5 text-slate-600" />
            )}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className={cn("flex items-center gap-3 px-4 py-3 mb-4", isCollapsed && !isMobileOpen && "justify-center px-0")}>
          {user?.logoUrl ? (
            <img 
              src={user.logoUrl} 
              alt="" 
              className="w-8 h-8 rounded-full object-contain bg-white/10 border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shrink-0">
              <span className="text-xs font-bold text-indigo-400">{user?.name?.[0]}</span>
            </div>
          )}
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block", planColors[currentPlan] || planColors.Trial)}>
                {currentPlan}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          title={isCollapsed && !isMobileOpen ? "Logout" : ""}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors",
            isCollapsed && !isMobileOpen && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#151619] border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.logoUrl ? (
            <img src={user.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain bg-white/10 border border-white/10" />
          ) : (
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="text-white font-bold text-sm">{user?.name || "FixTrack Pro"}</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-out Sidebar */}
      <div className={cn(
        "lg:hidden fixed top-0 left-0 bottom-0 z-50 bg-[#151619] text-white w-72 flex flex-col transition-transform duration-300 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Close button inside mobile sidebar */}
        <div className="flex items-center justify-end p-3">
          <button
            onClick={() => setIsMobileOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex bg-[#151619] text-white h-screen flex-col border-r border-white/5 transition-all duration-300 sticky top-0",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {sidebarContent}
      </div>
    </>
  );
}
