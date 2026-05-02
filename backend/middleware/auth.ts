import jwt from "jsonwebtoken";
import { Shop } from "../models/index.js";
import { sendEmail } from "../services/email.js";
import { subscriptionExpiredHtml } from "../services/emailTemplates.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    
    // Check subscription expiry and auto-downgrade if expired
    if (user.role !== 'admin') {
      try {
        const shop = await Shop.findById(user.id);
        // Cache shop on request so planMiddleware doesn't need to re-query
        req.shop = shop;
        if (shop && shop.subscription_plan !== 'Free' && shop.subscription_expires_at && shop.subscription_expires_at < new Date()) {
          const previousPlan = shop.subscription_plan;
          shop.subscription_plan = 'Free';
          shop.subscription_expires_at = undefined;
          await shop.save();

          // Send expiry notification email (fire and forget)
          sendEmail(
            shop.email,
            "⚠️ FixTrack Pro - Your Subscription Has Expired",
            `Hi ${shop.owner_name || shop.name},\n\nYour ${previousPlan} plan subscription has expired. Your account has been moved to the Free plan with limited features.\n\nTo continue enjoying full access, please log in and subscribe to a new plan.\n\nThank you for using FixTrack Pro!`,
            subscriptionExpiredHtml({
              ownerName: shop.owner_name || shop.name,
              previousPlan: previousPlan || 'Unknown',
              shopName: shop.name,
            })
          ).catch((e: any) => console.error("Failed to send expiry email:", e));

          // Attach expired info so the response can inform the frontend
          req.subscriptionExpired = true;
          req.previousPlan = previousPlan;
        }
      } catch (e) {
        console.error("Subscription expiry check error:", e);
      }
    }
    
    next();
  });
};
