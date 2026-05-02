// Canonical plan configuration for FixTrack Pro
// Used by both frontend (feature display, gating UI) and conceptually by backend (limits)

export type PlanKey = 'Trial' | 'Free' | 'Basic' | 'Pro' | 'Premium';

export interface PlanTier {
  id: string;
  name: string;
  price: number; // in Naira, 0 = free
  durationLabel: string;
  maxRepairsPerMonth: number; // -1 = unlimited
  maxStaff: number; // -1 = unlimited
  features: {
    inventory: boolean;
    receiptPrinting: boolean;
    deviceLabels: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    advancedAnalytics: boolean;
    exportReports: boolean;
    staffPerformance: boolean;
    editStaffRanking: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
  };
  featureList: string[]; // human-readable for billing page
}

export const PLAN_TIERS: Record<PlanKey, PlanTier> = {
  Trial: {
    id: 'trial',
    name: 'Trial',
    price: 0,
    durationLabel: 'Free / 7 days',
    maxRepairsPerMonth: -1,  // Unlimited during trial
    maxStaff: -1,            // Unlimited during trial
    features: {
      inventory: true,
      receiptPrinting: true,
      deviceLabels: true,
      emailNotifications: true,
      smsNotifications: true,
      advancedAnalytics: true,
      exportReports: true,
      staffPerformance: true,
      editStaffRanking: true,
      customBranding: true,
      prioritySupport: true,
    },
    featureList: [
      'All features unlocked for 7 days',
      'Unlimited repairs',
      'Unlimited staff',
      'Full access to everything',
    ],
  },
  Free: {
    id: 'free',
    name: 'Free',
    price: 0,
    durationLabel: 'Limited',
    maxRepairsPerMonth: 10,
    maxStaff: 1,
    features: {
      inventory: false,
      receiptPrinting: false,
      deviceLabels: false,
      emailNotifications: false,
      smsNotifications: false,
      advancedAnalytics: false,
      exportReports: false,
      staffPerformance: false,
      editStaffRanking: false,
      customBranding: false,
      prioritySupport: false,
    },
    featureList: [
      'Up to 10 repairs/month',
      '1 staff member',
      'Basic repair tracking only',
      'Subscribe to unlock more',
    ],
  },
  Basic: {
    id: 'basic',
    name: 'Basic',
    price: 5000,
    durationLabel: '₦5,000/mo',
    maxRepairsPerMonth: 50,
    maxStaff: 3,
    features: {
      inventory: true,
      receiptPrinting: true,
      deviceLabels: false,
      emailNotifications: true,
      smsNotifications: false,
      advancedAnalytics: false,
      exportReports: false,
      staffPerformance: false,
      editStaffRanking: false,
      customBranding: false,
      prioritySupport: false,
    },
    featureList: [
      'Up to 50 repairs/month',
      '3 staff members',
      'Inventory management',
      'Receipt printing',
      'Email notifications',
      'Basic dashboard',
    ],
  },
  Pro: {
    id: 'pro',
    name: 'Pro',
    price: 10000,
    durationLabel: '₦10,000/mo',
    maxRepairsPerMonth: -1,
    maxStaff: 10,
    features: {
      inventory: true,
      receiptPrinting: true,
      deviceLabels: true,
      emailNotifications: true,
      smsNotifications: true,
      advancedAnalytics: true,
      exportReports: false,
      staffPerformance: true,
      editStaffRanking: false,
      customBranding: false,
      prioritySupport: false,
    },
    featureList: [
      'Unlimited repairs',
      '10 staff members',
      'Everything in Basic',
      'SMS notifications',
      'Device label printing',
      'Advanced analytics & charts',
      'Staff performance ranking',
    ],
  },
  Premium: {
    id: 'premium',
    name: 'Premium',
    price: 20000,
    durationLabel: '₦20,000/mo',
    maxRepairsPerMonth: -1,
    maxStaff: -1,
    features: {
      inventory: true,
      receiptPrinting: true,
      deviceLabels: true,
      emailNotifications: true,
      smsNotifications: true,
      advancedAnalytics: true,
      exportReports: true,
      staffPerformance: true,
      editStaffRanking: true,
      customBranding: true,
      prioritySupport: true,
    },
    featureList: [
      'Unlimited repairs',
      'Unlimited staff',
      'Everything in Pro',
      'Edit staff rankings',
      'Export reports (CSV)',
      'Custom branding (logo on receipts)',
      'Priority support',
    ],
  },
};

// Helper: get the plan tier for a given plan name
export function getPlanTier(planName: string): PlanTier {
  const key = planName as PlanKey;
  return PLAN_TIERS[key] || PLAN_TIERS.Free;
}

// Helper: check if a feature is available on a given plan
export function hasFeature(planName: string, feature: keyof PlanTier['features']): boolean {
  const tier = getPlanTier(planName);
  return tier.features[feature];
}

// Helper: get the minimum plan required for a feature
export function getMinPlanForFeature(feature: keyof PlanTier['features']): string {
  const order: PlanKey[] = ['Trial', 'Free', 'Basic', 'Pro', 'Premium'];
  for (const key of order) {
    if (PLAN_TIERS[key].features[feature]) return key;
  }
  return 'Premium';
}
