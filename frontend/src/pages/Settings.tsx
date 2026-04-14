import React, { useState, useRef, useCallback, useEffect } from "react";
import { User, Store, Bell, Shield, Save, Upload, X as XIcon, Image, Trash2, Lock, Crown, Clock, Palette, Globe, Key, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";
import { api } from "../services/api";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useToast } from "../context/ToastContext";
import { hasFeature, getMinPlanForFeature } from "../config/planConfig";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export default function Settings({ user, onUpdate }: { user: any, onUpdate: (user: any) => void }) {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const userPlan = user?.plan || 'Trial';
  const canCustomBrand = hasFeature(userPlan, 'customBranding');

  useEffect(() => {
    document.title = "Settings — FixTrack Pro";
  }, []);

  const [formData, setFormData] = useState({
    shopName: user?.name || "",
    ownerName: user?.ownerName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  // Logo upload state
  const [logoPreview, setLogoPreview] = useState<string>(user?.logoUrl || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState({
    emailRepairUpdates: true,
    emailDailyReports: false,
    smsCustomerAlerts: false,
    lowInventoryAlerts: true,
    newRepairAlerts: true,
    paymentReceivedAlerts: true,
  });

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only PNG, JPG, WEBP, and SVG images are allowed.';
    }
    if (file.size > 2 * 1024 * 1024) {
      return 'File size must be under 2MB.';
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      error(validationError);
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [error]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    try {
      const res = await api.shop.uploadLogo(logoFile);
      if (res.shop) {
        localStorage.setItem("user", JSON.stringify(res.shop));
        onUpdate(res.shop);
        setLogoPreview(res.logoUrl);
        setLogoFile(null);
        success("Logo uploaded successfully!");
      } else {
        error(res.error || "Failed to upload logo");
      }
    } catch (err: any) {
      error(err.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setUploadingLogo(true);
    try {
      const res = await api.shop.deleteLogo();
      if (res.shop) {
        localStorage.setItem("user", JSON.stringify(res.shop));
        onUpdate(res.shop);
        setLogoPreview("");
        setLogoFile(null);
        success("Logo removed.");
      }
    } catch (err: any) {
      error(err.message || "Failed to remove logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!formData.shopName || !formData.ownerName) {
      error("Shop Name and Owner Name are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.shop.updateProfile({
        name: formData.shopName,
        ownerName: formData.ownerName,
        phone: formData.phone,
        address: formData.address,
      });
      if (res.shop) {
        localStorage.setItem("user", JSON.stringify(res.shop));
        onUpdate(res.shop);
        success("Profile updated successfully!");
      } else {
        error(res.error || "Failed to update profile");
      }
    } catch (err) {
      error("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) {
      error("Password must be at least 6 characters.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error("New passwords do not match!");
      return;
    }
    setSaving(true);
    try {
      const res = await api.shop.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      if (res.message) {
        success("Password updated successfully!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        error(res.error || "Failed to update password");
      }
    } catch (err) {
      error("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: Store, desc: "Shop details" },
    { key: "branding", label: "Branding", icon: Palette, desc: "Logo & appearance" },
    { key: "notifications", label: "Notifications", icon: Bell, desc: "Alerts & emails" },
    { key: "security", label: "Security", icon: Shield, desc: "Password & access" },
  ];

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shop Settings</h1>
        <p className="text-slate-500">Manage your shop profile, branding, and account preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="md:col-span-1 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-all duration-200",
                activeTab === tab.key 
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm truncate">{tab.label}</p>
                {activeTab !== tab.key && <p className="text-[10px] font-normal text-slate-400 truncate">{tab.desc}</p>}
              </div>
            </button>
          ))}

          {/* Account Info Card */}
          <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-900">{userPlan} Plan</p>
                <p className="text-[10px] text-indigo-600">Active</p>
              </div>
            </div>
            {user?.expiresAt && (
              <p className="text-[10px] text-indigo-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expires: {new Date(user.expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          
          {/* ═══ PROFILE TAB ═══ */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-900">Shop Profile</h2>
                <p className="text-xs text-slate-500 mt-1">Your shop's public information visible on receipts and customer communications.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Store className="w-3 h-3" /> Shop Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <User className="w-3 h-3" /> Owner Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input
                    type="email"
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 outline-none cursor-not-allowed"
                    value={formData.email}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed. Contact support if needed.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Shop Address
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
                    placeholder="Enter your shop's full address..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">Last saved just now</p>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* ═══ BRANDING TAB ═══ */}
          {activeTab === 'branding' && (
            <>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-slate-900">Shop Logo</h2>
                  {!canCustomBrand && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-full border border-amber-200">
                      <Lock className="w-3 h-3" /> {getMinPlanForFeature('customBranding')}+ Plan
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  {canCustomBrand 
                    ? 'Your logo appears on receipts, labels, the sidebar, and customer-facing documents. Max 2MB (PNG, JPG, WEBP, SVG).'
                    : `Upgrade to ${getMinPlanForFeature('customBranding')} plan to upload a custom logo for receipts and branded documents.`
                  }
                </p>
                
                {canCustomBrand ? (
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    {/* Current Logo Preview */}
                    <div className="flex-shrink-0">
                      <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50">
                        {logoPreview ? (
                          <img 
                            src={logoPreview.startsWith('data:') ? logoPreview : logoPreview} 
                            alt="Shop Logo" 
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <div className="text-center">
                            <Image className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="text-[10px] text-slate-400 mt-1">No logo</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Drop Zone */}
                    <div className="flex-1 w-full">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
                          isDragging
                            ? "border-indigo-400 bg-indigo-50 scale-[1.02]"
                            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                        )}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileSelect(e.target.files[0]);
                            }
                          }}
                        />
                        <Upload className={cn(
                          "w-8 h-8 mx-auto mb-2 transition-colors",
                          isDragging ? "text-indigo-500" : "text-slate-400"
                        )} />
                        <p className="text-sm font-medium text-slate-700">
                          {isDragging ? "Drop your logo here" : "Drag & drop your logo here"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">or click to browse files</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 mt-4">
                        {logoFile && (
                          <>
                            <div className="flex-1 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg truncate">
                              📎 {logoFile.name} ({(logoFile.size / 1024).toFixed(0)}KB)
                            </div>
                            <button
                              onClick={handleUploadLogo}
                              disabled={uploadingLogo}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              {uploadingLogo ? "Uploading..." : "Upload"}
                            </button>
                            <button
                              onClick={() => {
                                setLogoFile(null);
                                setLogoPreview(user?.logoUrl || "");
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!logoFile && logoPreview && (
                          <button
                            onClick={handleRemoveLogo}
                            disabled={uploadingLogo}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove Logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Locked State for non-Premium */
                  <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Custom Branding Locked</h3>
                    <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                      Upload your shop logo to brand receipts, jobcards, and the sidebar. Available on the {getMinPlanForFeature('customBranding')} plan.
                    </p>
                    <button
                      onClick={() => window.location.href = '/billing'}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                      Upgrade to {getMinPlanForFeature('customBranding')}
                    </button>
                  </div>
                )}
              </div>

              {/* Branding Preview */}
              {canCustomBrand && logoPreview && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Receipt Preview</h3>
                  <div className="bg-slate-50 rounded-xl p-6 max-w-xs mx-auto text-center border border-slate-200">
                    <img src={logoPreview} alt="Logo Preview" className="w-12 h-12 object-contain mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-900">{formData.shopName || "Your Shop"}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Repair Receipt</p>
                    {formData.address && <p className="text-[10px] text-slate-400 mt-1">{formData.address}</p>}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ NOTIFICATIONS TAB ═══ */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Email Notifications</h2>
                <p className="text-xs text-slate-500 mb-6">Control which emails you receive about your shop activity.</p>
                <div className="space-y-3">
                  {[
                    { key: "emailRepairUpdates", label: "Repair Status Updates", desc: "Get notified when repair statuses change.", icon: CheckCircle, available: true },
                    { key: "emailDailyReports", label: "Daily Summary Reports", desc: "Receive a daily overview of shop performance.", icon: Clock, available: hasFeature(userPlan, 'advancedAnalytics') },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.available ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400")}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            {item.label}
                            {!item.available && <Lock className="w-3 h-3 text-slate-400" />}
                          </p>
                          <p className="text-[10px] text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => item.available && setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                        className={cn(
                          "w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0",
                          !item.available ? "bg-slate-200 cursor-not-allowed opacity-50" :
                          notifications[item.key as keyof typeof notifications] ? "bg-indigo-600" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm",
                          notifications[item.key as keyof typeof notifications] ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Alert Preferences</h2>
                <p className="text-xs text-slate-500 mb-6">In-app alerts and push notification settings.</p>
                <div className="space-y-3">
                  {[
                    { key: "lowInventoryAlerts", label: "Low Inventory Alerts", desc: "Get warned when parts run below threshold.", icon: AlertTriangle },
                    { key: "newRepairAlerts", label: "New Repair Check-in", desc: "Alert when a new device is checked in.", icon: Bell },
                    { key: "paymentReceivedAlerts", label: "Payment Received", desc: "Alert when a customer payment is recorded.", icon: CheckCircle },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{item.label}</p>
                          <p className="text-[10px] text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                        className={cn(
                          "w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0",
                          notifications[item.key as keyof typeof notifications] ? "bg-emerald-500" : "bg-slate-200"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm",
                          notifications[item.key as keyof typeof notifications] ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ SECURITY TAB ═══ */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
                  <p className="text-xs text-slate-500 mt-1">Ensure your account stays secure with a strong password.</p>
                </div>
                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Password</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        required
                        className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="••••••••"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          required
                          className="w-full px-4 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="••••••••"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? "text" : "password"}
                          required
                          className="w-full px-4 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="••••••••"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className={cn(
                            "h-1.5 rounded-full flex-1 transition-colors",
                            passwordData.newPassword.length >= (i + 1) * 3 
                              ? i < 1 ? "bg-red-400" : i < 2 ? "bg-amber-400" : i < 3 ? "bg-emerald-400" : "bg-emerald-500"  
                              : "bg-slate-200"
                          )} />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {passwordData.newPassword.length < 6 ? "Too short — minimum 6 characters" :
                         passwordData.newPassword.length < 9 ? "Fair — consider adding numbers or symbols" :
                         passwordData.newPassword.length < 12 ? "Good password strength" :
                         "Strong password 💪"}
                      </p>
                    </div>
                  )}
                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={saving}
                      className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" /> 
                      {saving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Session Info */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Active Session</h2>
                <p className="text-xs text-slate-500 mb-6">Your current session information.</p>
                <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Current Browser</p>
                      <p className="text-[10px] text-slate-500">Session will expire after 2 hours of inactivity</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
