import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { Bell, Search, X } from "lucide-react";
import { api } from "../../services/api";
import { format } from "date-fns";

export default function AdminLayout({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef<HTMLDivElement>(null);

  // Update page title based on current admin route
  useEffect(() => {
    const adminRouteTitles: Record<string, string> = {
      "/admin": "Dashboard",
      "/admin/shops": "Shops",
      "/admin/subscriptions": "Subscriptions",
      "/admin/wallet": "Wallet",
      "/admin/transactions": "Transactions",
      "/admin/logs": "System Logs",
      "/admin/settings": "Settings",
    };
    const title = adminRouteTitles[location.pathname] || "Admin";
    document.title = `${title} | FixTrack Pro Admin`;
  }, [location.pathname]);

  useEffect(() => {
    // Load recent subscriptions as notifications
    api.admin.stats().then(data => {
      const recent = (data.recentSubscriptions || []).slice(0, 8).map((sub: any) => ({
        id: sub._id || sub.id,
        title: `New ${sub.plan} subscription`,
        subtitle: sub.shop_id?.name || 'Unknown Shop',
        amount: sub.amount,
        time: sub.created_at,
        read: false
      }));
      setNotifications(recent);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Navigate to shops page with search pre-populated via URL param
    navigate(`/admin/shops?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AdminSidebar user={user} onLogout={onLogout} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search shops, transactions, or users globally..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-xl focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          
          <div className="flex items-center gap-6 pl-8">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  // Mark all as read
                  if (!showNotifications) {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  }
                }}
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 border-2 border-white rounded-full text-[8px] text-white font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-slate-400 text-sm">No notifications yet.</p>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className="p-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50"
                          onClick={() => { navigate('/admin/transactions'); setShowNotifications(false); }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                              <p className="text-xs text-slate-500">{notif.subtitle}</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-600">+₦{(notif.amount || 0).toLocaleString()}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {notif.time ? format(new Date(notif.time), 'MMM dd, HH:mm') : ''}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                    <button 
                      onClick={() => { navigate('/admin/transactions'); setShowNotifications(false); }}
                      className="w-full text-center text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                    >
                      View All Transactions
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                 <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                 <p className="text-xs text-slate-500">Super Admin</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
                 {user?.name?.[0]}
               </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
           <div className="p-8 max-w-7xl mx-auto w-full">
              <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
}
