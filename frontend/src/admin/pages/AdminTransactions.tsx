import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { format } from "date-fns";
import { Search, Filter, Download, ChevronDown } from "lucide-react";
import { AdminTransactionsSkeleton } from "../components/AdminSkeleton";

export default function AdminTransactions() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

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

  const transactions = stats?.allSubscriptions || stats?.recentSubscriptions || [];

  const filteredTransactions = transactions.filter((tx: any) => {
    const matchesSearch = search.trim() === "" ||
      tx.reference.toLowerCase().includes(search.toLowerCase()) ||
      (tx.shop_id?.name || '').toLowerCase().includes(search.toLowerCase());

    const txStatus = tx.status || 'success';
    const matchesStatus = statusFilter === "All" || txStatus === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    if (!filteredTransactions.length) return;

    const headers = ["Reference", "Shop", "Plan", "Amount (₦)", "Date", "Status"];
    const rows = filteredTransactions.map((tx: any) => [
      tx.reference,
      tx.shop_id?.name || 'Deleted Shop',
      tx.plan,
      tx.amount || 0,
      tx.created_at ? format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm') : '',
      tx.status || 'success'
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fixtrack-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return <AdminTransactionsSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
          <p className="text-slate-500 mt-1">A detailed ledger of all incoming subscription payments.</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleExportCSV}
             disabled={filteredTransactions.length === 0}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
           >
             <Download className="w-4 h-4" /> Export CSV
           </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search by reference ID or shop name..." 
               className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-shadow"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <div className="relative">
             <button 
               onClick={() => setShowFilterMenu(!showFilterMenu)}
               className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
             >
               <Filter className="w-4 h-4" /> {statusFilter === "All" ? "Status: All" : statusFilter} <ChevronDown className="w-3 h-3" />
             </button>
             {showFilterMenu && (
               <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[150px] overflow-hidden">
                 {["All", "Success", "Pending", "Failed"].map((status) => (
                   <button 
                     key={status} 
                     onClick={() => { setStatusFilter(status); setShowFilterMenu(false); }}
                     className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${statusFilter === status ? 'font-bold text-red-600 bg-red-50/50' : 'text-slate-700'}`}
                   >
                     {status}
                   </button>
                 ))}
               </div>
             )}
           </div>
           <div className="text-sm text-slate-500 flex items-center font-medium">
             {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction ID / Ref</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shop</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx: any) => (
                <tr key={tx._id || tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">{tx.reference}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-slate-900">{tx.shop_id?.name || 'Deleted Shop'}</p>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 uppercase">{tx.plan}</span>
                  </td>
                  <td className="px-6 py-4">
                     <span className="font-bold text-slate-900">₦{(tx.amount || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-sm text-slate-600">{format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                       tx.status === 'success' || !tx.status ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                       tx.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                       'bg-red-50 text-red-700 border-red-200'
                     }`}>
                       {tx.status || 'success'}
                     </span>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
