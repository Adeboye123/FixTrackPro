import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { Shop, Subscription, Admin } from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { sendEmail } from "../services/email.js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use memory storage instead of disk — works on Render's ephemeral filesystem
// The image is stored as a base64 data URI in MongoDB
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, WEBP, and SVG images are allowed.'));
    }
  }
});

const router = express.Router();

// Get current shop's subscription status (used by frontend to detect expiry)
router.get("/me", authenticateToken, async (req: any, res) => {
  const shop = await Shop.findById(req.user.id);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  res.json({
    id: shop._id,
    name: shop.name,
    email: shop.email,
    ownerName: shop.owner_name,
    phone: shop.phone,
    address: shop.address,
    plan: shop.subscription_plan,
    expiresAt: shop.subscription_expires_at,
    logoUrl: shop.logo_url,
    subscriptionExpired: req.subscriptionExpired || false,
    previousPlan: req.previousPlan || null,
  });
});

router.patch("/profile", authenticateToken, async (req: any, res) => {
  const { name, ownerName, phone, address, logoUrl } = req.body;
  const shop = await Shop.findByIdAndUpdate(req.user.id, {
    name,
    owner_name: ownerName,
    phone,
    address,
    logo_url: logoUrl
  }, { new: true });

  res.json({
    message: "Profile updated", shop: {
      id: shop?._id,
      name: shop?.name,
      email: shop?.email,
      ownerName: shop?.owner_name,
      phone: shop?.phone,
      address: shop?.address,
      plan: shop?.subscription_plan,
      logoUrl: shop?.logo_url
    }
  });
});

router.patch("/password", authenticateToken, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  const shop = await Shop.findById(req.user.id);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  const isMatch = await bcrypt.compare(currentPassword, shop.password);
  if (!isMatch) return res.status(400).json({ error: "Current password incorrect" });

  shop.password = await bcrypt.hash(newPassword, 10);
  await shop.save();
  res.json({ message: "Password updated" });
});

router.post("/subscribe", authenticateToken, async (req: any, res) => {
  const { plan, amount, reference } = req.body;
  const shop = await Shop.findById(req.user.id);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  const formattedPlan = plan ? plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase() : 'Basic';
  const validPlans = ['Trial', 'Basic', 'Pro', 'Premium'];
  if (!validPlans.includes(formattedPlan)) {
    return res.status(400).json({ error: "Invalid subscription plan" });
  }

  const existingSub = await Subscription.findOne({ reference });
  if (existingSub) return res.status(400).json({ error: "Duplicate transaction reference" });

  // Verify transaction with Paystack if a secret key is provided
  if (process.env.PAYSTACK_SECRET_KEY && reference !== 'trial') {
    try {
      const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      });
      const paystackData = await paystackRes.json();
      
      if (!paystackData.status) {
        return res.status(400).json({ error: "Payment verification failed to communicate with Paystack" });
      }

      const txStatus = paystackData.data.status;
      
      if (txStatus !== 'success' && txStatus !== 'pending') {
        return res.status(400).json({ error: `Payment not successful. Status: ${txStatus}` });
      }

      // We continue to save the subscription. If pending, it is saved as 'pending'
      const sub = new Subscription({
        shop_id: req.user.id,
        plan: formattedPlan,
        amount,
        reference,
        status: txStatus
      });
      await sub.save();

      // Only upgrade the shop plan if the payment was actually successful
      if (txStatus === 'success') {
        let currentExpiry = shop.subscription_expires_at ? new Date(shop.subscription_expires_at) : new Date();
        if (currentExpiry < new Date()) currentExpiry = new Date();
      
        currentExpiry.setDate(currentExpiry.getDate() + 30);
      
        shop.subscription_plan = formattedPlan;
        shop.subscription_expires_at = currentExpiry;
        await shop.save();
      
        // Notify Super Admins
        try {
          const admins = await Admin.find();
          for (const admin of admins) {
            await sendEmail(
              admin.email,
              "New Shop Subscription - FixTrack Pro",
              `Shop "${shop.name}" just subscribed to the ${formattedPlan} plan for ₦${amount}.`
            );
          }
        } catch (error) {
          console.error("Failed to send admin notification:", error);
        }

        return res.json({ message: "Subscription upgraded successfully", shop, status: txStatus });
      } else {
        // It's pending
        return res.json({ message: "Payment is pending verification", shop, status: txStatus });
      }

    } catch (error) {
      console.error("Paystack verification error:", error);
      return res.status(500).json({ error: "Error verifying payment with gateway" });
    }
  }

  // Fallback for trial or non-paystack
  const sub = new Subscription({
    shop_id: req.user.id,
    plan: formattedPlan,
    amount,
    reference,
    status: 'success'
  });
  // Only reach here if we bypassed Paystack (e.g. Trial plan logic if applicable)
  await sub.save();

  let currentExpiry = shop.subscription_expires_at ? new Date(shop.subscription_expires_at) : new Date();
  if (currentExpiry < new Date()) currentExpiry = new Date();

  currentExpiry.setDate(currentExpiry.getDate() + 30);

  shop.subscription_plan = formattedPlan;
  shop.subscription_expires_at = currentExpiry;
  await shop.save();

  res.json({ message: "Subscription upgraded", shop, status: 'success' });
});

// Logo upload — stores as base64 data URI in MongoDB (production-safe for ephemeral filesystems)
router.post("/logo", authenticateToken, (req: any, res, next) => {
  uploadMiddleware.single("logo")(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: "File too large. Maximum size is 2MB." });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message || "Upload failed" });
    }
    next();
  });
}, async (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const shop = await Shop.findById(req.user.id);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  // Convert the uploaded buffer to a base64 data URI
  const base64 = req.file.buffer.toString('base64');
  const dataUri = `data:${req.file.mimetype};base64,${base64}`;

  shop.logo_url = dataUri;
  await shop.save();

  res.json({
    message: "Logo uploaded successfully",
    logoUrl: dataUri,
    shop: {
      id: shop._id,
      name: shop.name,
      email: shop.email,
      ownerName: shop.owner_name,
      phone: shop.phone,
      address: shop.address,
      plan: shop.subscription_plan,
      logoUrl: shop.logo_url
    }
  });
});

// Remove logo
router.delete("/logo", authenticateToken, async (req: any, res) => {
  const shop = await Shop.findById(req.user.id);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  shop.logo_url = '';
  await shop.save();

  res.json({
    message: "Logo removed",
    shop: {
      id: shop._id,
      name: shop.name,
      email: shop.email,
      ownerName: shop.owner_name,
      phone: shop.phone,
      address: shop.address,
      plan: shop.subscription_plan,
      logoUrl: ''
    }
  });
});

export default router;
