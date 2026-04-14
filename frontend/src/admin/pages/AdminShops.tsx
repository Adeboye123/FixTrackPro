import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Search, Filter, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { AdminShopsSkeleton } from "../components/AdminSkeleton";

export default function AdminShops() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

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

  const handleUpdatePlan = async (shopId: string, plan: string) => {
    try {
      await api.admin.updatePlan(shopId, plan);
      fetchStats();
    } catch(e) {
      console.error(e);
    }
  };

  const filteredShops = stats?.shops?.filter((shop: any) => {
    const matchesSearch = search.trim() === "" || 
      shop.name.toLowerCase().includes(search.toLowerCase()) ||
      shop.email.toLowerCase().includes(search.toLowerCase()) ||
      shop.owner_name.toLowerCase().includes(search.toLowerCase());

    const matchesPlan = planFilter === "All" || shop.subscription_plan === planFilter;

    return matchesSearch && matchesPlan;
  }) || [];

  if (loading) return <AdminShopsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Shops</h1>
          <p className="text-slate-500 mt-1">View and manage all registered establishments.</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
             <button 
               onClick={() => setShowFilterMenu(!showFilterMenu)}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
             >
               <Filter className="w-4 h-4" /> {planFilter === "All" ? "All Plans" : planFilter} <ChevronDown className="w-3 h-3" />
             </button>
             {showFilterMenu && (
               <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden">
                 {["All", "Trial", "Basic", "Pro", "Premium"].map((plan) => (
                   <button 
                     key={plan} 
                     onClick={() => { setPlanFilter(plan); setShowFilterMenu(false); }}
                     className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${planFilter === plan ? 'font-bold text-red-600 bg-red-50/50' : 'text-slate-700'}`}
                   >
                     {plan === "All" ? "All Plans" : plan}
                   </button>
                 ))}
               </div>
             )}
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search shop name, email, or owner..." 
               className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-shadow"
               value={search}
               onChange={(e) => setSearch(e.target.value)} 
             />
           </div>
           <div className="text-sm text-slate-500 flex items-center font-medium">
             {filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''}
           </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shop Details</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Owner</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan & Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredShops.map((shop: any) => (
              <tr key={shop.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold">
                       {shop.logo_url ? <img src={shop.logo_url} className="w-full h-full object-cover rounded-lg" alt="logo"/> : shop.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{shop.name}</p>
                      <p className="text-xs text-slate-500">{shop.phone || 'No phone'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <p className="text-sm font-medium text-slate-900">{shop.owner_name}</p>
                   <p className="text-xs text-slate-500">{shop.email}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      shop.subscription_plan === 'Premium' ? 'bg-amber-100 text-amber-700' :
                      shop.subscription_plan === 'Pro' ? 'bg-indigo-100 text-indigo-700' :
                      shop.subscription_plan === 'Basic' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {shop.subscription_plan}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Expires: {shop.subscription_expires_at ? format(new Date(shop.subscription_expires_at), 'MMM dd, yyyy') : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleUpdatePlan(shop.id, 'Basic')} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded hover:bg-emerald-100 transition-colors">Basic</button>
                      <button onClick={() => handleUpdatePlan(shop.id, 'Pro')} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded hover:bg-indigo-100 transition-colors">Pro</button>
                      <button onClick={() => handleUpdatePlan(shop.id, 'Premium')} className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded hover:bg-amber-100 transition-colors">Prem</button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {filteredShops.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">No shops found matching your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
