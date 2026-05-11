import { Shop } from "../models/index.js";
import { sendEmail, maskEmail } from "./email.js";
import { subscriptionExpiredHtml } from "./emailTemplates.js";

/**
 * Subscription Expiry Cron Job
 * Runs every hour to check for expired subscriptions and downgrade them.
 * This ensures shops are downgraded even if they don't make any API calls.
 */

async function checkExpiredSubscriptions() {
  try {
    const now = new Date();
    
    // Find all shops with expired subscriptions that haven't been downgraded yet
    // Only exclude Free (already downgraded) — catch expired Trial AND paid plans
    const expiredShops = await Shop.find({
      subscription_plan: { $ne: 'Free' },
      subscription_expires_at: { $lt: now }
    });

    if (expiredShops.length === 0) return;

    console.log(`[CRON] Found ${expiredShops.length} expired subscription(s). Processing...`);

    for (const shop of expiredShops) {
      const previousPlan = shop.subscription_plan;
      shop.subscription_plan = 'Free';
      shop.subscription_expires_at = undefined;
      await shop.save();

      console.log(`[CRON] Downgraded shop "${shop.name}" (${maskEmail(shop.email)}) from ${previousPlan} to Free`);

      // Send notification email
      try {
        await sendEmail(
          shop.email,
          "⚠️ FixTrack Pro - Your Subscription Has Expired",
          `Hi ${shop.owner_name || shop.name},\n\nYour ${previousPlan} plan subscription has expired. Your account has been moved to the Free plan with limited features.\n\nTo continue enjoying full access, please log in and subscribe to a new plan.\n\nThank you for using FixTrack Pro!`,
          subscriptionExpiredHtml({
            ownerName: shop.owner_name || shop.name,
            previousPlan: previousPlan || 'Unknown',
            shopName: shop.name,
          })
        );
      } catch (emailErr) {
        console.error(`[CRON] Failed to send expiry email to ${maskEmail(shop.email)}:`, emailErr);
      }
    }

    console.log(`[CRON] Finished processing ${expiredShops.length} expired subscription(s)`);
  } catch (error) {
    console.error("[CRON] Subscription expiry check failed:", error);
  }
}

// Run every hour (3600000 ms)
const CRON_INTERVAL = 60 * 60 * 1000;

export function startSubscriptionCron() {
  // Run immediately on startup
  checkExpiredSubscriptions();
  
  // Then run every hour
  setInterval(checkExpiredSubscriptions, CRON_INTERVAL);
  console.log("[CRON] Subscription expiry checker started (runs every hour)");
}
