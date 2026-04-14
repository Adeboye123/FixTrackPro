import { Request, Response, NextFunction } from "express";
import { Shop, Repair, Staff } from "../models/index.js";

// Plan limits configuration (mirrors frontend planConfig.ts)
const PLAN_LIMITS: Record<string, { maxRepairs: number; maxStaff: number; features: Record<string, boolean> }> = {
  Trial: {
    maxRepairs: -1,  // Unlimited during active trial
    maxStaff: -1,    // Unlimited during active trial
    features: { inventory: true, receiptPrinting: true, deviceLabels: true, emailNotifications: true, smsNotifications: true, advancedAnalytics: true, staffPerformance: true, customBranding: true }
  },
  Basic: {
    maxRepairs: 50,
    maxStaff: 3,
    features: { inventory: true, receiptPrinting: true, deviceLabels: false, emailNotifications: true, smsNotifications: false, advancedAnalytics: false, staffPerformance: false, customBranding: false }
  },
  Pro: {
    maxRepairs: -1,
    maxStaff: 10,
    features: { inventory: true, receiptPrinting: true, deviceLabels: true, emailNotifications: true, smsNotifications: true, advancedAnalytics: true, staffPerformance: true, customBranding: false }
  },
  Premium: {
    maxRepairs: -1,
    maxStaff: -1,
    features: { inventory: true, receiptPrinting: true, deviceLabels: true, emailNotifications: true, smsNotifications: true, advancedAnalytics: true, staffPerformance: true, customBranding: true }
  }
};

function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.Trial;
}

// Helper: check if a shop's trial has expired
function isTrialExpired(shop: any): boolean {
  if (shop.subscription_plan !== 'Trial') return false;
  if (!shop.subscription_expires_at) return true; // No expiry date = expired
  return new Date(shop.subscription_expires_at) < new Date();
}

// Middleware: check repair creation limit
export function checkRepairLimit() {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const shop = await Shop.findById(req.user.id);
      if (!shop) return res.status(404).json({ error: "Shop not found" });

      // Check if trial has expired
      if (isTrialExpired(shop)) {
        return res.status(403).json({
          error: "Your 7-day free trial has ended. Please subscribe to a plan to continue using FixTrack Pro.",
          code: 'TRIAL_EXPIRED',
          currentPlan: 'Trial'
        });
      }

      const limits = getPlanLimits(shop.subscription_plan || 'Trial');
      
      if (limits.maxRepairs === -1) return next(); // Unlimited

      // Count repairs created this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const repairCount = await Repair.countDocuments({
        shop_id: req.user.id,
        created_at: { $gte: startOfMonth }
      });

      if (repairCount >= limits.maxRepairs) {
        return res.status(403).json({
          error: `You've reached your ${shop.subscription_plan} plan limit of ${limits.maxRepairs} repairs/month. Upgrade your plan to continue.`,
          code: 'PLAN_LIMIT_REPAIRS',
          currentPlan: shop.subscription_plan,
          limit: limits.maxRepairs,
          used: repairCount
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

// Middleware: check staff creation limit
export function checkStaffLimit() {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const shop = await Shop.findById(req.user.id);
      if (!shop) return res.status(404).json({ error: "Shop not found" });

      // Check if trial has expired
      if (isTrialExpired(shop)) {
        return res.status(403).json({
          error: "Your 7-day free trial has ended. Please subscribe to a plan to continue using FixTrack Pro.",
          code: 'TRIAL_EXPIRED',
          currentPlan: 'Trial'
        });
      }

      const limits = getPlanLimits(shop.subscription_plan || 'Trial');
      
      if (limits.maxStaff === -1) return next(); // Unlimited

      const staffCount = await Staff.countDocuments({ shop_id: req.user.id });

      if (staffCount >= limits.maxStaff) {
        return res.status(403).json({
          error: `You've reached your ${shop.subscription_plan} plan limit of ${limits.maxStaff} staff member(s). Upgrade your plan to add more.`,
          code: 'PLAN_LIMIT_STAFF',
          currentPlan: shop.subscription_plan,
          limit: limits.maxStaff,
          used: staffCount
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

// Middleware: check if a specific feature is available on the shop's plan
export function requireFeature(featureName: string) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const shop = await Shop.findById(req.user.id);
      if (!shop) return res.status(404).json({ error: "Shop not found" });

      // Check if trial has expired
      if (isTrialExpired(shop)) {
        return res.status(403).json({
          error: "Your 7-day free trial has ended. Please subscribe to a plan to continue using FixTrack Pro.",
          code: 'TRIAL_EXPIRED',
          currentPlan: 'Trial'
        });
      }

      const limits = getPlanLimits(shop.subscription_plan || 'Trial');

      if (!limits.features[featureName]) {
        // Determine minimum plan needed
        const minPlan = Object.entries(PLAN_LIMITS).find(([_, l]) => l.features[featureName])?.[0] || 'Premium';
        
        return res.status(403).json({
          error: `${featureName.replace(/([A-Z])/g, ' $1').trim()} is not available on your ${shop.subscription_plan} plan. Upgrade to ${minPlan} or higher.`,
          code: 'PLAN_FEATURE_LOCKED',
          feature: featureName,
          currentPlan: shop.subscription_plan,
          requiredPlan: minPlan
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

