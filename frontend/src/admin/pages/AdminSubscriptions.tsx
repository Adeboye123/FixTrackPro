import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { CreditCard, Ban, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { AdminSubscriptionsSkeleton } from "../components/AdminSkeleton";

export default function AdminSubscriptions() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.admin.stats();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleUpdatePlan = async (shopId: string, plan: string) => {
    try {
      await api.admin.updatePlan(shopId, plan);
      const data = await api.admin.stats();
      setStats(data);
    } catch(e) {
      console.error(e);
    }
  };

  if (loading) return <AdminSubscriptionsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Active Subscriptions</h1>
          <p className="text-slate-500 mt-1">Monitor, suspend, or modify shop access levels.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shop</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Plan</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Billing Cycle</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Overrides</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats?.shops?.map((shop: any) => (
              <tr key={shop.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{shop.name}</p>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                     <CreditCard className={`w-4 h-4 ${shop.subscription_plan === 'Premium' ? 'text-amber-500' : 'text-slate-400'}`} />
                     <span className="text-sm font-bold text-slate-700">{shop.subscription_plan}</span>
                   </div>
                </td>
                <td className="px-6 py-4">
                   {shop.subscription_expires_at ? (
                      <div className="flex items-center gap-2">
                        {new Date(shop.subscription_expires_at) > new Date() ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Ban className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm text-slate-600 font-medium">
                          {format(new Date(shop.subscription_expires_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                   ) : (
                     <span className="text-sm text-slate-400 italic">No exact expiry</span>
                   )}
                </td>
                <td className="px-6 py-4 text-right">
                   <select 
                     value={shop.subscription_plan}
                     onChange={(e) => handleUpdatePlan(shop.id, e.target.value)}
                     className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none bg-slate-50 font-medium text-slate-700"
                   >
                     <option value="Trial">Trial (7 Days)</option>
                     <option value="Basic">Basic</option>
                     <option value="Pro">Pro</option>
                     <option value="Premium">Premium</option>
                     <option value="Suspended">Suspended</option>
                   </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
