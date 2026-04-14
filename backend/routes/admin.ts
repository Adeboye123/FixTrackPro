import express from "express";
import { Shop, Repair, Subscription, PlatformSettings } from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Default pricing (used if no PlatformSettings exist yet)
const DEFAULT_PRICING = {
  basic: 5000,
  pro: 10000,
  premium: 20000,
};

// Public endpoint – no auth required (used by shop Billing page)
router.get("/pricing", async (_req: any, res: any) => {
  const pricingSetting = await PlatformSettings.findOne({ key: "pricing" });
  res.json({
    pricing: pricingSetting?.value || DEFAULT_PRICING,
  });
});

router.get("/stats", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
  
  const totalShops = await Shop.countDocuments();
  const totalRepairs = await Repair.countDocuments();
  const totalRevenue = await Repair.aggregate([{ $group: { _id: null, total: { $sum: "$amount_paid" } } }]);
  
  const subscriptionRevenue = await Subscription.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
  const allSubscriptions = await Subscription.find().populate('shop_id', 'name owner_name email').sort({ created_at: -1 });
  
  const shops = await Shop.find({}, 'name owner_name email phone subscription_plan subscription_expires_at created_at logo_url')
    .sort({ created_at: -1 });
  
  const recentShops = await Shop.find().sort({ created_at: -1 }).limit(5);
  
  res.json({ 
    totalShops, 
    totalRepairs, 
    totalRepairRevenue: totalRevenue[0]?.total || 0,
    subscriptionRevenue: subscriptionRevenue[0]?.total || 0,
    recentSubscriptions: allSubscriptions.slice(0, 10),
    allSubscriptions,
    shops,
    recentShops
  });
});

router.patch("/shops/:id/plan", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
  
  const { plan, expiryDays } = req.body;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + (expiryDays || 30));
  
  await Shop.findByIdAndUpdate(req.params.id, {
    subscription_plan: plan,
    subscription_expires_at: expiry
  });
  
  res.json({ message: `Plan updated to ${plan}` });
});

// ---- Platform Settings CRUD ----
router.get("/settings", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
  
  const pricingSetting = await PlatformSettings.findOne({ key: "pricing" });
  
  res.json({
    pricing: pricingSetting?.value || DEFAULT_PRICING,
  });
});

router.patch("/settings/pricing", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
  
  const { basic, pro, premium } = req.body;
  
  const pricing = {
    basic: Number(basic) || DEFAULT_PRICING.basic,
    pro: Number(pro) || DEFAULT_PRICING.pro,
    premium: Number(premium) || DEFAULT_PRICING.premium,
  };
  
  await PlatformSettings.findOneAndUpdate(
    { key: "pricing" },
    { value: pricing, updated_at: new Date() },
    { upsert: true, returnDocument: 'after' }
  );
  
  res.json({ message: "Pricing updated successfully", pricing });
});

// ---- Sync Paystack Pending Transactions ----
router.post("/sync-paystack", authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
  
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET) {
    return res.status(400).json({ error: "Paystack secret key not configured" });
  }
  
  const pendingSubs = await Subscription.find({ status: "pending" }).populate('shop_id');
  let synced = 0;
  let failed = 0;
  
  for (const sub of pendingSubs) {
    try {
      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${sub.reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
      });
      const paystackData = await paystackRes.json();
      
      if (paystackData.status && paystackData.data) {
        const txStatus = paystackData.data.status;
        
        if (txStatus === 'success') {
          sub.status = 'success';
          await sub.save();
          
          // Upgrade the shop plan
          const shop = await Shop.findById(sub.shop_id);
          if (shop) {
            let currentExpiry = shop.subscription_expires_at ? new Date(shop.subscription_expires_at) : new Date();
            if (currentExpiry < new Date()) currentExpiry = new Date();
            currentExpiry.setDate(currentExpiry.getDate() + 30);
            
            shop.subscription_plan = sub.plan as any;
            shop.subscription_expires_at = currentExpiry;
            await shop.save();
          }
          synced++;
        } else if (txStatus === 'failed' || txStatus === 'abandoned') {
          sub.status = 'failed';
          await sub.save();
          synced++;
        }
        // If still 'pending' on Paystack side, leave as-is
      }
    } catch (err) {
      console.error(`Failed to verify ${sub.reference}:`, err);
      failed++;
    }
  }
  
  res.json({
    message: `Sync complete. ${synced} transaction(s) updated, ${failed} failed.`,
    synced,
    failed,
    totalPending: pendingSubs.length,
  });
});

export default router;
