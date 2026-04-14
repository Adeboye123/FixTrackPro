import React from "react";

// Skeleton loading components for FixTrack Pro
// Used across Dashboard, Repairs, Inventory, Staff, Billing

export function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />;
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonPulse className="h-7 w-64" />
          <SkeletonPulse className="h-4 w-48" />
        </div>
        <SkeletonPulse className="h-10 w-36 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonPulse className="w-12 h-12 rounded-xl" />
              <SkeletonPulse className="h-3 w-16" />
            </div>
            <SkeletonPulse className="h-8 w-24" />
            <SkeletonPulse className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <SkeletonPulse className="h-5 w-40" />
            <SkeletonPulse className="h-3 w-24" />
          </div>
          <SkeletonPulse className="h-[300px] w-full rounded-xl" />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <SkeletonPulse className="h-5 w-36" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <SkeletonPulse className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonPulse className="h-4 w-32" />
                <SkeletonPulse className="h-3 w-24" />
              </div>
              <SkeletonPulse className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Repairs table skeleton
export function RepairsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonPulse className="h-7 w-52" />
          <SkeletonPulse className="h-4 w-64" />
        </div>
        <SkeletonPulse className="h-12 w-44 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <SkeletonPulse className="flex-1 h-10 rounded-xl" />
          <SkeletonPulse className="h-10 w-32 rounded-xl" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 py-3">
              <div className="space-y-2 flex-1">
                <SkeletonPulse className="h-4 w-24" />
                <SkeletonPulse className="h-3 w-36" />
              </div>
              <SkeletonPulse className="h-4 w-28 hidden md:block" />
              <SkeletonPulse className="h-6 w-20 rounded-lg" />
              <SkeletonPulse className="h-4 w-24" />
              <div className="flex gap-1">
                <SkeletonPulse className="w-8 h-8 rounded-lg" />
                <SkeletonPulse className="w-8 h-8 rounded-lg" />
                <SkeletonPulse className="w-8 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Staff grid skeleton
export function StaffSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonPulse className="h-7 w-48" />
          <SkeletonPulse className="h-4 w-64" />
        </div>
        <SkeletonPulse className="h-12 w-44 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <SkeletonPulse className="w-12 h-12 rounded-2xl" />
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-28" />
                <SkeletonPulse className="h-3 w-20" />
              </div>
            </div>
            <div className="space-y-3">
              <SkeletonPulse className="h-4 w-40" />
              <SkeletonPulse className="h-4 w-32" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
              <SkeletonPulse className="h-16 rounded-xl" />
              <SkeletonPulse className="h-16 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Inventory table skeleton
export function InventorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonPulse className="h-7 w-56" />
          <SkeletonPulse className="h-4 w-64" />
        </div>
        <SkeletonPulse className="h-12 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <SkeletonPulse className="w-12 h-12 rounded-xl" />
            <div className="space-y-2">
              <SkeletonPulse className="h-4 w-20" />
              <SkeletonPulse className="h-6 w-12" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 py-3">
            <SkeletonPulse className="h-4 w-36 flex-1" />
            <SkeletonPulse className="h-4 w-20" />
            <SkeletonPulse className="h-4 w-12" />
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="w-8 h-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Billing skeleton
export function BillingSkeleton() {
  return (
    <div className="space-y-8">
      <SkeletonPulse className="h-24 w-full rounded-2xl" />
      <div className="text-center space-y-2">
        <SkeletonPulse className="h-8 w-56 mx-auto" />
        <SkeletonPulse className="h-4 w-72 mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-4">
            <SkeletonPulse className="w-12 h-12 rounded-2xl" />
            <SkeletonPulse className="h-6 w-24" />
            <SkeletonPulse className="h-8 w-32" />
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <SkeletonPulse key={j} className="h-4 w-full" />
              ))}
            </div>
            <SkeletonPulse className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
