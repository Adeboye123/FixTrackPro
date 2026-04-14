import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Wrench, Clock, CheckCircle, Wallet, ArrowUpRight, TrendingUp, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardSkeleton } from "../components/Skeleton";

export default function Dashboard({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard — FixTrack Pro";
    api.dashboard.stats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <DashboardSkeleton />;

  // Trial expiry calculation
  const currentPlan = user?.plan || 'Trial';
  const trialExpiresAt = user?.expiresAt ? new Date(user.expiresAt) : null;
  const now = new Date();
  const trialDaysLeft = trialExpiresAt ? Math.max(0, Math.ceil((trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const isTrialExpired = currentPlan === 'Trial' && trialDaysLeft <= 0;
  const isTrialWarning = currentPlan === 'Trial' && trialDaysLeft > 0 && trialDaysLeft <= 2;

  const cards = [
    { name: "Active Repairs", value: stats.active || 0, icon: Wrench, color: "bg-indigo-500", sub: "Currently in shop" },
    { name: "Completed", value: stats.completed || 0, icon: CheckCircle, color: "bg-emerald-500", sub: "Ready for pickup" },
    { name: "Total Revenue", value: `₦${(stats.revenue || 0).toLocaleString()}`, icon: Wallet, color: "bg-blue-500", sub: "All time earnings" },
    { name: "Pending Payments", value: `₦${(stats.pending_payments || 0).toLocaleString()}`, icon: AlertCircle, color: "bg-amber-500", sub: "Balance to collect" },
  ];

  return (
    <div className="space-y-8">
      {/* Trial Expired Banner */}
      {isTrialExpired && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-900">Your 7-day free trial has ended</p>
              <p className="text-xs text-red-700">Subscribe to a plan to continue using all features.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/billing')}
            className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors shrink-0"
          >
            Subscribe Now
          </button>
        </div>
      )}

      {/* Trial Warning Banner (≤ 2 days left) */}
      {isTrialWarning && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Trial ending soon — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left</p>
              <p className="text-xs text-amber-700">Subscribe now to avoid interruption to your workflow.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/billing')}
            className="px-5 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-colors shrink-0"
          >
            View Plans
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Welcome back, {user?.ownerName}</h1>
          <p className="text-sm text-slate-500">Here's what's happening at {user?.name} today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs sm:text-sm font-bold">
          <TrendingUp className="w-4 h-4" />
          Shop is Active
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card) => (
          <div key={card.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-xl text-white shadow-lg shadow-current/20`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.name.split(' ')[0]}</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Revenue Overview</h2>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                <span className="text-xs font-bold text-slate-500 uppercase">Past 30 Days</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10}}
                    tickFormatter={(str) => format(new Date(str), 'MMM d')}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10}}
                    tickFormatter={(val) => `₦${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(val: any) => [`₦${val.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Pending Payments</h2>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-full">
                {stats.pending_list?.length || 0} Customers
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Device</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.pending_list?.map((item: any) => (
                    <tr key={item.id} className="group">
                      <td className="py-4">
                        <p className="text-sm font-bold text-slate-900">{item.customer_name}</p>
                        <p className="text-[10px] text-slate-400">Job ID: {item.job_id}</p>
                      </td>
                      <td className="py-4 text-sm text-slate-600">{item.device_model}</td>
                      <td className="py-4 text-right">
                        <span className="text-sm font-black text-red-600">₦{item.balance.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                  {(!stats.pending_list || stats.pending_list.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 text-sm italic">No pending payments.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h2>
            <div className="space-y-6">
              {stats.recent?.map((repair: any) => (
                <div key={repair.id} className="flex items-start gap-4 group cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    repair.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {repair.customer_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{repair.device_model} - {repair.status}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">₦{repair.amount_paid.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">{format(new Date(repair.created_at), 'HH:mm')}</p>
                  </div>
                </div>
              ))}
              {(!stats.recent || stats.recent.length === 0) && (
                <div className="text-center py-12 text-slate-400 italic text-sm">No recent activity.</div>
              )}
            </div>
            <button 
              onClick={() => navigate('/repairs')}
              className="w-full mt-8 py-3 rounded-xl bg-slate-50 text-slate-600 text-sm font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
            >
              View All Repairs <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
