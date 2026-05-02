import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Save, CheckCircle2, AlertCircle, Shield, ShieldAlert, ShieldCheck, Clock, Globe, Monitor } from "lucide-react";
import { format } from "date-fns";
import { AdminSettingsSkeleton } from "../components/AdminSkeleton";

export default function AdminSettings() {
  const [pricing, setPricing] = useState({ basic: 5000, pro: 10000, premium: 20000 });
  const [editMode, setEditMode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string, text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pricing' | 'security' | 'info'>('pricing');

  // Security logs
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'security') {
      loadSecurityLogs();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      const data = await api.admin.getSettings();
      if (data.pricing) {
        setPricing(data.pricing);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityLogs = async () => {
    setLoadingLogs(true);
    try {
      const data = await api.admin.getSecurityLogs();
      setSecurityLogs(data.logs || []);
      setFailedCount(data.recentFailedAttempts || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.admin.updatePricing(pricing);
      setMessage({ type: 'success', text: 'Pricing updated successfully!' });
      setEditMode(null);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Failed to save pricing' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminSettingsSkeleton />;

  const plans = [
    { key: 'basic', name: 'Basic Plan', desc: 'For small shops just getting started' },
    { key: 'pro', name: 'Pro Plan', desc: 'For established shops that need more power' },
    { key: 'premium', name: 'Premium Plan', desc: 'For large shops that want everything' },
  ];

  // Parse short browser name from user agent
  const parseBrowser = (ua: string) => {
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    return 'Unknown';
  };

  const tabs = [
    { key: 'pricing', label: 'Pricing', icon: Save },
    { key: 'security', label: 'Security Logs', icon: Shield },
    { key: 'info', label: 'Platform Info', icon: Globe },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-slate-500 mt-1">Global configurations for FixTrack Pro.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
          <p className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{message.text}</p>
        </div>
      )}

      {/* ═══ PRICING TAB ═══ */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Subscription Pricing</h3>
            {editMode && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save All'}
              </button>
            )}
          </div>
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.key} className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <p className="font-bold text-slate-700">{plan.name}</p>
                  <p className="text-xs text-slate-500">{plan.desc}</p>
                  {editMode === plan.key ? (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-slate-500">₦</span>
                      <input
                        type="number"
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono w-32 outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500"
                        value={pricing[plan.key as keyof typeof pricing]}
                        onChange={(e) => setPricing({ ...pricing, [plan.key]: Number(e.target.value) })}
                        autoFocus
                      />
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">Currently ₦{pricing[plan.key as keyof typeof pricing].toLocaleString()} / month</p>
                  )}
                </div>
                <button
                  onClick={() => setEditMode(editMode === plan.key ? null : plan.key)}
                  className={`px-3 py-1 font-medium rounded-lg text-sm transition-colors ${
                    editMode === plan.key
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {editMode === plan.key ? 'Cancel' : 'Edit'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SECURITY LOGS TAB ═══ */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Status */}
          {failedCount > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl shrink-0">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900">{failedCount} failed login attempt{failedCount > 1 ? 's' : ''} in the last 24 hours</h3>
                <p className="text-xs text-red-700 mt-0.5">Review the logs below for details. Consider changing your password if you don't recognize the activity.</p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900">All Clear</h3>
                <p className="text-xs text-emerald-700 mt-0.5">No failed login attempts in the last 24 hours. Your admin dashboard is secure.</p>
              </div>
            </div>
          )}

          {/* Login History */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Login Activity</h3>
                <p className="text-xs text-slate-500 mt-0.5">Recent login attempts to your admin dashboard (last 50)</p>
              </div>
              <button
                onClick={loadSecurityLogs}
                disabled={loadingLogs}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingLogs ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {loadingLogs ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading security logs...</div>
            ) : securityLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No login activity recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Browser</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {securityLogs.map((log: any) => (
                      <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${!log.success ? 'bg-red-50/30' : ''}`}>
                        <td className="px-6 py-3">
                          {log.success ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full">
                              <ShieldCheck className="w-3 h-3" /> Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-full">
                              <ShieldAlert className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-xs font-medium text-slate-700">
                              {log.created_at ? format(new Date(log.created_at), 'MMM dd, yyyy · HH:mm') : 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs font-mono text-slate-600">{log.ip || 'Unknown'}</span>
                        </td>
                        <td className="px-6 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Monitor className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-600">{parseBrowser(log.user_agent || '')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 hidden lg:table-cell">
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px] block">{log.failure_reason || 'Authenticated'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Security Tips */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">🛡️ Security Best Practices</h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                Use a strong, unique password (12+ characters with numbers, symbols, uppercase)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                Never share your admin credentials with anyone
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                Always log out when using shared computers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                Review your security logs regularly for unauthorized access
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                Email alerts are sent on every login — check your inbox if notified
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ═══ PLATFORM INFO TAB ═══ */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Platform Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Platform Name</span>
              <span className="text-sm font-bold text-slate-900">FixTrack Pro</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Version</span>
              <span className="text-sm font-bold text-slate-900">1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Trial Duration</span>
              <span className="text-sm font-bold text-slate-900">7 Days</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
