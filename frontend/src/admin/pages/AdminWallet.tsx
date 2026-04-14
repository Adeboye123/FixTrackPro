import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Wallet as WalletIcon, ArrowDownRight, RefreshCw, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { AdminWalletSkeleton } from "../components/AdminSkeleton";

export default function AdminWallet() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

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

  const handleSyncPaystack = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await api.admin.syncPaystack();
      setSyncResult(result);
      // Refresh stats after sync
      const data = await api.admin.stats();
      setStats(data);
    } catch (e: any) {
      setSyncResult({ error: e.message });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <AdminWalletSkeleton />;

  const totalRevenue = stats?.subscriptionRevenue || 0;
  const pendingCount = stats?.allSubscriptions?.filter((s: any) => s.status === 'pending')?.length || 0;
  const pendingAmount = stats?.allSubscriptions?.filter((s: any) => s.status === 'pending')?.reduce((sum: number, s: any) => sum + (s.amount || 0), 0) || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Wallet</h1>
          <p className="text-slate-500 mt-1">Manage global subscription revenue and balance.</p>
        </div>
        <button 
          onClick={() => setShowWithdrawModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
        >
           Withdraw Funds
        </button>
      </div>

      {/* Sync Result Banner */}
      {syncResult && (
        <div className={`p-4 rounded-xl flex items-center justify-between ${syncResult.error ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
          <div className="flex items-center gap-3">
            {syncResult.error ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
            <p className={`text-sm font-medium ${syncResult.error ? 'text-red-700' : 'text-emerald-700'}`}>
              {syncResult.error || syncResult.message}
            </p>
          </div>
          <button onClick={() => setSyncResult(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#0a0b0e] rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-indigo-500/10">
           <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
           
           <div className="relative z-10 flex flex-col h-full justify-between gap-8">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-slate-400 font-medium tracking-wide uppercase text-xs mb-1">Total Revenue</p>
                 <div className="flex items-baseline gap-2">
                   <h2 className="text-5xl font-black text-white tracking-tight">₦{totalRevenue.toLocaleString()}</h2>
                   <span className="text-slate-500 font-bold">.00</span>
                 </div>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                 <WalletIcon className="w-6 h-6 text-red-400" />
               </div>
             </div>

             <div className="flex gap-8">
                <div>
                  <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Successful Payments</p>
                  <p className="text-xl font-bold text-white">{stats?.allSubscriptions?.filter((s: any) => s.status === 'success' || !s.status)?.length || 0}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Pending</p>
                  <p className="text-xl font-bold text-amber-400">{pendingCount} (₦{pendingAmount.toLocaleString()})</p>
                </div>
             </div>
           </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-4 shadow-sm">
           <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-4">Quick Actions</h3>
           <div className="grid grid-cols-1 gap-3 flex-1">
             <button 
               onClick={handleSyncPaystack} 
               disabled={syncing}
               className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 transition-colors disabled:opacity-50"
             >
               <RefreshCw className={`w-6 h-6 text-indigo-600 ${syncing ? 'animate-spin' : ''}`} />
               <div className="text-left">
                 <span className="text-sm font-bold text-slate-700 block">{syncing ? 'Syncing...' : 'Sync Paystack'}</span>
                 <span className="text-xs text-slate-500">Re-verify pending payments</span>
               </div>
             </button>
             <button 
               onClick={() => setShowWithdrawModal(true)}
               className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 transition-colors"
             >
               <ArrowDownRight className="w-6 h-6 text-emerald-600" />
               <div className="text-left">
                 <span className="text-sm font-bold text-slate-700 block">Withdraw</span>
                 <span className="text-xs text-slate-500">Transfer to bank account</span>
               </div>
             </button>
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Recent Wallet Activity</h3>
        </div>
        <div>
          {(!stats?.recentSubscriptions || stats.recentSubscriptions.length === 0) ? (
            <p className="p-8 text-center text-slate-500 text-sm">No transaction activity to display.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentSubscriptions.slice(0, 10).map((tx: any) => (
                <div key={tx._id || tx.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                   <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                       tx.status === 'success' || !tx.status ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                       tx.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                       'bg-red-50 text-red-600 border-red-100'
                     }`}>
                       <ArrowDownRight className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="font-bold text-sm text-slate-900">Sub Payment: {tx.shop_id?.name || 'Unknown'}</p>
                       <p className="text-xs text-slate-500">
                         {format(new Date(tx.created_at), 'MMM dd, yyyy • hh:mm a')} • Ref: {tx.reference}
                       </p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className={`font-bold ${tx.status === 'success' || !tx.status ? 'text-emerald-600' : tx.status === 'pending' ? 'text-amber-600' : 'text-red-600'}`}>
                       +₦{(tx.amount || 0).toLocaleString()}
                     </p>
                     <p className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block mt-1 border ${
                       tx.status === 'success' || !tx.status ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                       tx.status === 'pending' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                       'text-red-600 border-red-200 bg-red-50'
                     }`}>
                       {tx.status || 'Success'}
                     </p>
                   </div>
                </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Withdraw Funds</h2>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Available Balance</p>
                <p className="text-3xl font-black text-slate-900">₦{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Bank Withdrawal Coming Soon</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Direct bank withdrawal will be available once you connect your bank account via Paystack. For now, access your funds directly from your Paystack dashboard.
                  </p>
                </div>
              </div>
              <a 
                href="https://dashboard.paystack.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl transition-all hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                Open Paystack Dashboard
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
