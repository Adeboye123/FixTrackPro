import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import { AdminSettingsSkeleton } from "../components/AdminSkeleton";

export default function AdminSettings() {
  const [pricing, setPricing] = useState({ basic: 5000, pro: 10000, premium: 20000 });
  const [editMode, setEditMode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string, text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-slate-500 mt-1">Global configurations for FixTrack Pro.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
          <p className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{message.text}</p>
        </div>
      )}

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
    </div>
  );
}
