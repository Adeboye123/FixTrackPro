import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Plus, User, Mail, Phone, X, TrendingUp, Award, Lock, Trash2, ChevronDown } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { getPlanTier } from "../config/planConfig";
import { StaffSkeleton } from "../components/Skeleton";

export default function Staff() {
  const { error, success } = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRankId, setEditingRankId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "Technician",
    email: "",
    phone: "",
    ranking: "Bronze"
  });
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentPlan = user?.plan || 'Trial';
  const planTier = getPlanTier(currentPlan);
  const staffLimit = planTier.maxStaff;
  const canEditRanking = planTier.features.editStaffRanking;

  const handleAddStaffClick = () => {
    // Let any plan attempt — backend enforces the exact limit
    setShowModal(true);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const data = await api.staff.list();
    setStaff(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.staff.create(formData);
      success("Staff member added successfully!");
      setShowModal(false);
      setFormData({ name: "", role: "Technician", email: "", phone: "", ranking: "Bronze" });
      fetchStaff();
    } catch (err: any) {
      if (err.message?.includes('plan limit') || err.message?.includes('Upgrade')) {
        error(err.message);
        setTimeout(() => navigate('/billing'), 2000);
      } else {
        error(err.message || "Failed to add staff member.");
      }
    }
  };

  const handleRankChange = async (staffId: string, newRanking: string) => {
    try {
      await api.staff.updateRanking(staffId, newRanking);
      success(`Ranking updated to ${newRanking}`);
      setEditingRankId(null);
      fetchStaff();
    } catch (err: any) {
      if (err.message?.includes('plan') || err.message?.includes('Upgrade') || err.message?.includes('PLAN_FEATURE_LOCKED')) {
        error("Editing staff rankings requires a Premium plan.");
        setTimeout(() => navigate('/billing'), 2000);
      } else {
        error(err.message || "Failed to update ranking.");
      }
    }
  };

  const handleDelete = async (staffId: string, staffName: string) => {
    if (!window.confirm(`Remove ${staffName} from your team? This cannot be undone.`)) return;
    try {
      await api.staff.delete(staffId);
      success(`${staffName} has been removed.`);
      fetchStaff();
    } catch (err: any) {
      error(err.message || "Failed to remove staff member.");
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Platinum': return 'bg-slate-900 text-white';
      case 'Gold': return 'bg-amber-100 text-amber-700';
      case 'Silver': return 'bg-slate-100 text-slate-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  const rankOptions = ['Bronze', 'Silver', 'Gold', 'Platinum'];

  if (loading) return <StaffSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-slate-500">Manage your team and track their performance.</p>
        </div>
        <button
          onClick={handleAddStaffClick}
          className="px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" /> Add Staff Member
          {staffLimit !== -1 && (
            <span className="text-xs opacity-75">({staff.length}/{staffLimit})</span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div key={member._id || member.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow relative group">
            {/* Rank badge — clickable to edit if Premium */}
            <div className="absolute top-4 right-4 z-10">
              {editingRankId === (member._id || member.id) ? (
                <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg border border-slate-200 p-1">
                  {rankOptions.map((rank) => (
                    <button
                      key={rank}
                      onClick={() => handleRankChange(member._id || member.id, rank)}
                      className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                        member.ranking === rank 
                          ? getRankColor(rank) + ' ring-2 ring-indigo-500' 
                          : 'hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      {rank}
                    </button>
                  ))}
                  <button
                    onClick={() => setEditingRankId(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (canEditRanking) {
                      setEditingRankId(member._id || member.id);
                    } else {
                      error("Editing staff rankings requires a Premium plan.");
                    }
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getRankColor(member.ranking)} ${
                    canEditRanking ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all' : 'cursor-default'
                  }`}
                  title={canEditRanking ? "Click to change ranking" : "Premium plan required to edit rankings"}
                >
                  {member.ranking}
                  {canEditRanking && <ChevronDown className="w-3 h-3 inline ml-1 -mt-0.5" />}
                </button>
              )}
            </div>

            {/* Delete button — appears on hover */}
            <button
              onClick={() => handleDelete(member._id || member.id, member.name)}
              className="absolute top-4 left-4 p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all z-10"
              title="Remove staff member"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{member.name}</h3>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{member.role}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Mail className="w-4 h-4" /> {member.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <Phone className="w-4 h-4" /> {member.phone}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Repairs</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="font-bold text-slate-900">{member.total_repairs || 0}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Revenue</p>
                  <div className="flex items-center gap-2">
                    <Award className="w-3 h-3 text-amber-500" />
                    <span className="font-bold text-slate-900">₦{(member.revenue_generated || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {staff.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 italic">
            No staff members added yet.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Add Staff Member</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ebuka Obi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Junior Engineer">Junior Engineer</option>
                    <option value="Technician">Technician</option>
                    <option value="Senior Engineer">Senior Engineer</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="ebuka@fixtrack.pro"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="080..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Initial Ranking</label>
                <select
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.ranking}
                  onChange={(e) => setFormData({ ...formData, ranking: e.target.value })}
                >
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                </select>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                >
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
