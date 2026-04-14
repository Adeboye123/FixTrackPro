import React from "react";

// ─── Base shimmer block ───
function Pulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

// ═══════════════════════════════════════════════════════════
// Admin Dashboard Skeleton
// Mirrors: 4 MetricCards + Recent Signups table + Latest Payments sidebar
// ═══════════════════════════════════════════════════════════
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Pulse className="h-7 w-52" />
        <Pulse className="h-4 w-80" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <Pulse className="w-14 h-14 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Pulse className="h-3 w-24" />
              <Pulse className="h-7 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Two-column: Table + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Signups table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <Pulse className="h-5 w-36" />
            <Pulse className="h-3 w-16" />
          </div>
          {/* Table header */}
          <div className="px-6 py-4 bg-slate-50/50 flex gap-8">
            <Pulse className="h-3 w-20" />
            <Pulse className="h-3 w-12 ml-auto" />
            <Pulse className="h-3 w-16" />
          </div>
          {/* Table rows */}
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div className="space-y-2">
                  <Pulse className="h-4 w-32" />
                  <Pulse className="h-3 w-44" />
                </div>
                <Pulse className="h-5 w-14 rounded-full" />
                <Pulse className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Latest Payments sidebar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pulse className="w-5 h-5 rounded" />
              <Pulse className="h-5 w-32" />
            </div>
            <Pulse className="h-3 w-8" />
          </div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="space-y-2">
                  <Pulse className="h-4 w-28" />
                  <Pulse className="h-3 w-36" />
                </div>
                <div className="text-right space-y-2">
                  <Pulse className="h-4 w-20 ml-auto" />
                  <Pulse className="h-4 w-12 rounded-full ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Admin Shops Skeleton
// Mirrors: Header + filter + search bar + table with avatar rows
// ═══════════════════════════════════════════════════════════
export function AdminShopsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Pulse className="h-7 w-44" />
          <Pulse className="h-4 w-72" />
        </div>
        <Pulse className="h-10 w-32 rounded-xl" />
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
          <Pulse className="flex-1 max-w-md h-9 rounded-lg" />
          <Pulse className="h-9 w-20 rounded-lg" />
        </div>
        {/* Table header */}
        <div className="px-6 py-4 border-b border-slate-100 flex gap-12">
          <Pulse className="h-3 w-24" />
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-24" />
          <Pulse className="h-3 w-16 ml-auto" />
        </div>
        {/* Table rows */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-6">
              {/* Avatar + name */}
              <div className="flex items-center gap-3 flex-1">
                <Pulse className="w-10 h-10 rounded-lg shrink-0" />
                <div className="space-y-2">
                  <Pulse className="h-4 w-28" />
                  <Pulse className="h-3 w-20" />
                </div>
              </div>
              {/* Owner */}
              <div className="space-y-2 flex-1 hidden md:block">
                <Pulse className="h-4 w-24" />
                <Pulse className="h-3 w-36" />
              </div>
              {/* Plan badge */}
              <div className="space-y-2">
                <Pulse className="h-5 w-14 rounded-md" />
                <Pulse className="h-3 w-28" />
              </div>
              {/* Actions */}
              <div className="flex gap-2">
                <Pulse className="h-6 w-12 rounded" />
                <Pulse className="h-6 w-10 rounded" />
                <Pulse className="h-6 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Admin Settings Skeleton
// Mirrors: Pricing cards + Platform Info
// ═══════════════════════════════════════════════════════════
export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="space-y-2">
        <Pulse className="h-7 w-48" />
        <Pulse className="h-4 w-64" />
      </div>

      {/* Pricing card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Pulse className="h-4 w-40" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="space-y-2">
                <Pulse className="h-4 w-28" />
                <Pulse className="h-3 w-48" />
                <Pulse className="h-3 w-36" />
              </div>
              <Pulse className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Platform Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <Pulse className="h-4 w-28" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Pulse className="h-4 w-28" />
              <Pulse className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Admin Subscriptions Skeleton
// Mirrors: Header + table with plan selectors
// ═══════════════════════════════════════════════════════════
export function AdminSubscriptionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Pulse className="h-7 w-52" />
        <Pulse className="h-4 w-72" />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header row */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex gap-12">
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-24" />
          <Pulse className="h-3 w-24" />
          <Pulse className="h-3 w-20 ml-auto" />
        </div>
        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-8">
              <Pulse className="h-4 w-28 flex-1" />
              <div className="flex items-center gap-2">
                <Pulse className="w-4 h-4 rounded" />
                <Pulse className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Pulse className="w-4 h-4 rounded-full" />
                <Pulse className="h-4 w-24" />
              </div>
              <Pulse className="h-7 w-28 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Admin Transactions Skeleton
// Mirrors: Header + Export button + search/filter + table
// ═══════════════════════════════════════════════════════════
export function AdminTransactionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Pulse className="h-7 w-52" />
          <Pulse className="h-4 w-80" />
        </div>
        <Pulse className="h-10 w-32 rounded-xl" />
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Search + filter */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
          <Pulse className="flex-1 max-w-md h-9 rounded-lg" />
          <Pulse className="h-9 w-32 rounded-lg" />
          <Pulse className="h-9 w-20 rounded-lg" />
        </div>
        {/* Table header */}
        <div className="px-6 py-4 border-b border-slate-100 flex gap-8">
          <Pulse className="h-3 w-32" />
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-12" />
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-16 ml-auto" />
        </div>
        {/* Rows */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-6">
              <Pulse className="h-6 w-36 rounded bg-slate-100" />
              <Pulse className="h-4 w-24" />
              <Pulse className="h-5 w-14 rounded-md" />
              <Pulse className="h-4 w-20" />
              <Pulse className="h-4 w-28" />
              <Pulse className="h-5 w-16 rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Admin Wallet Skeleton
// Mirrors: Header + Wallet hero card + Quick actions + Activity list
// ═══════════════════════════════════════════════════════════
export function AdminWalletSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Pulse className="h-7 w-44" />
          <Pulse className="h-4 w-72" />
        </div>
        <Pulse className="h-10 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet hero card */}
        <div className="md:col-span-2 bg-[#0a0b0e] rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <Pulse className="h-3 w-24 !bg-slate-700" />
                <Pulse className="h-12 w-48 !bg-slate-700" />
              </div>
              <Pulse className="w-12 h-12 rounded-2xl !bg-slate-800" />
            </div>
            <div className="flex gap-8">
              <div className="space-y-2">
                <Pulse className="h-3 w-32 !bg-slate-700" />
                <Pulse className="h-6 w-12 !bg-slate-700" />
              </div>
              <div className="space-y-2">
                <Pulse className="h-3 w-20 !bg-slate-700" />
                <Pulse className="h-6 w-24 !bg-slate-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-4 shadow-sm">
          <Pulse className="h-5 w-28 mb-2" />
          <Pulse className="h-16 w-full rounded-2xl" />
          <Pulse className="h-16 w-full rounded-2xl" />
        </div>
      </div>

      {/* Activity list */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <Pulse className="h-5 w-40" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Pulse className="w-10 h-10 rounded-full shrink-0" />
                <div className="space-y-2">
                  <Pulse className="h-4 w-40" />
                  <Pulse className="h-3 w-52" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <Pulse className="h-4 w-24 ml-auto" />
                <Pulse className="h-4 w-16 rounded-full ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
