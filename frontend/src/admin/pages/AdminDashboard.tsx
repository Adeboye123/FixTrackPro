import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Users, Wrench, Wallet, History, Store, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { AdminDashboardSkeleton } from "../components/AdminSkeleton";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.admin.stats();
      setStats(data);
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AdminDashboardSkeleton />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 mt-1">Real-time metrics and activity across all FixTrack shops.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Shops" value={stats?.totalShops || 0} icon={Store} color="indigo" onClick={() => navigate('/admin/shops')} />
        <MetricCard title="Active Subscriptions" value={stats?.recentSubscriptions?.length || 0} icon={Users} color="emerald" onClick={() => navigate('/admin/subscriptions')} />
        <MetricCard title="Global Repairs" value={stats?.totalRepairs || 0} icon={Wrench} color="amber" />
        <MetricCard title="Total Revenue" value={`₦${(stats?.subscriptionRevenue || 0).toLocaleString()}`} icon={Wallet} color="red" onClick={() => navigate('/admin/wallet')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <h2 className="text-lg font-bold text-slate-900">Recent Signups</h2>
               <button
                 onClick={() => navigate('/admin/shops')}
                 className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
               >
                 View All <ArrowRight className="w-3 h-3" />
               </button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50/50">
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shop Name</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</th>
                     <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Joined</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {stats?.shops?.slice(0, 5).map((shop: any) => (
                     <tr key={shop.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/admin/shops')}>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{shop.name}</p>
                          <p className="text-xs text-slate-500">{shop.email}</p>
                        </td>
                        <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                           shop.subscription_plan === 'Premium' ? 'bg-amber-100 text-amber-700' :
                           shop.subscription_plan === 'Pro' ? 'bg-indigo-100 text-indigo-700' :
                           shop.subscription_plan === 'Basic' ? 'bg-emerald-100 text-emerald-700' :
                           'bg-slate-100 text-slate-700'
                         }`}>
                           {shop.subscription_plan}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right text-sm text-slate-500 font-medium whitespace-nowrap">
                         {shop.created_at ? format(new Date(shop.created_at), 'MMM dd, yyyy') : 'Unknown'}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
         </div>
         
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-900">Latest Payments</h2>
              </div>
              <button
                onClick={() => navigate('/admin/transactions')}
                className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-0">
               {(!stats?.recentSubscriptions || stats.recentSubscriptions.length === 0) ? (
                 <div className="p-8 text-center text-slate-500 text-sm">No recent transactions.</div>
               ) : (
                 <div className="divide-y divide-slate-100">
                   {stats.recentSubscriptions.slice(0, 5).map((sub: any) => (
                     <div key={sub._id || sub.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/admin/transactions')}>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{sub.shop_id?.name || 'Unknown Shop'}</p>
                          <p className="text-xs text-slate-500">{format(new Date(sub.created_at), 'MMM dd • HH:mm')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">+₦{(sub.amount || 0).toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
                            {sub.plan}
                          </p>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, onClick }: { title: string, value: string | number, icon: any, color: 'indigo' | 'emerald' | 'amber' | 'red', onClick?: () => void }) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <div 
      className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 transition-all' : ''}`}
      onClick={onClick}
    >
      <div className={`p-4 rounded-xl border ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
