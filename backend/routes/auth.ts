import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Shop, Admin } from "../models/index.js";
import { sendEmail } from "../services/email.js";
import { otpEmailHtml } from "../services/emailTemplates.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

router.post("/register", async (req, res) => {
  const { shopName, ownerName, email: rawEmail, phone, password, bankName, accountNumber, accountName } = req.body;
  const email = rawEmail?.toLowerCase().trim();
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    
    const shop = new Shop({
      name: shopName,
      owner_name: ownerName,
      email,
      phone,
      password: hashedPassword,
      subscription_plan: 'Trial',
      subscription_expires_at: expiry,
      bank_details: {
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName
      }
    });
    
    await shop.save();
    res.status(201).json({ id: shop._id.toString(), message: "Shop registered successfully with 7-day trial" });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const email = rawEmail?.toLowerCase().trim();
  
  const admin = await Admin.findOne({ email });
  if (admin) {
    const validPassword = await bcrypt.compare(password, admin.password);
    if (validPassword) {
      const token = jwt.sign(
        { id: admin._id.toString(), email: admin.email, name: admin.name, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '2h' }
      );
      return res.json({ token, user: { id: admin._id.toString(), email: admin.email, name: admin.name, role: 'admin' } });
    }
  }

  const shop = await Shop.findOne({ email });
  if (!shop) return res.status(400).json({ error: "User not found" });

  const validPassword = await bcrypt.compare(password, shop.password);
  if (!validPassword) return res.status(400).json({ error: "Invalid password" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  shop.verification_code = otp;
  shop.verification_code_expires_at = new Date(Date.now() + 10 * 60 * 1000);
  await shop.save();

  await sendEmail(
    shop.email,
    "FixTrack Pro - Login Verification Code",
    `Your verification code is: ${otp}. It expires in 10 minutes.`,
    otpEmailHtml(otp, 'login')
  );

  res.json({ message: "OTP sent to email", requiresOTP: true, email: shop.email });
});

router.post("/verify-otp", async (req, res) => {
  const { email: rawEmail, otp } = req.body;
  const email = rawEmail?.toLowerCase().trim();
  const shop = await Shop.findOne({ 
    email, 
    verification_code: otp,
    verification_code_expires_at: { $gt: new Date() }
  });

  if (!shop) return res.status(400).json({ error: "Invalid or expired OTP" });

  shop.verification_code = undefined;
  shop.verification_code_expires_at = undefined;
  shop.is_verified = true;
  await shop.save();

  const token = jwt.sign(
    { id: shop._id.toString(), email: shop.email, name: shop.name, role: 'user' },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
  
  res.json({ token, user: { 
    id: shop._id.toString(), 
    email: shop.email, 
    name: shop.name, 
    ownerName: shop.owner_name, 
    plan: shop.subscription_plan,
    expiresAt: shop.subscription_expires_at,
    address: shop.address,
    logoUrl: shop.logo_url
  } });
});

router.post("/forgot-password", async (req, res) => {
  const { email: rawEmail } = req.body;
  const email = rawEmail?.toLowerCase().trim();
  const shop = await Shop.findOne({ email });
  if (!shop) return res.status(404).json({ error: "Email not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  shop.verification_code = otp;
  shop.verification_code_expires_at = new Date(Date.now() + 10 * 60 * 1000);
  await shop.save();

  await sendEmail(
    shop.email,
    "FixTrack Pro - Password Reset Code",
    `Your password reset code is: ${otp}. It expires in 10 minutes.`,
    otpEmailHtml(otp, 'reset')
  );

  res.json({ message: "Reset code sent to email" });
});

router.post("/reset-password", async (req, res) => {
  const { email: rawEmail, otp, newPassword } = req.body;
  const email = rawEmail?.toLowerCase().trim();
  const shop = await Shop.findOne({ 
    email, 
    verification_code: otp,
    verification_code_expires_at: { $gt: new Date() }
  });

  if (!shop) return res.status(400).json({ error: "Invalid or expired code" });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  shop.password = hashedPassword;
  shop.verification_code = undefined;
  shop.verification_code_expires_at = undefined;
  await shop.save();

  res.json({ message: "Password reset successful" });
});

router.post("/resend-otp", async (req, res) => {
  const { email: rawEmail } = req.body;
  const email = rawEmail?.toLowerCase().trim();
  const shop = await Shop.findOne({ email });
  if (!shop) return res.status(400).json({ error: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  shop.verification_code = otp;
  shop.verification_code_expires_at = new Date(Date.now() + 10 * 60 * 1000);
  await shop.save();

  await sendEmail(
    shop.email,
    "FixTrack Pro - Login Verification Code",
    `Your verification code is: ${otp}. It expires in 10 minutes.`,
    otpEmailHtml(otp, 'login')
  );

  res.json({ message: "A new verification code has been sent to your email" });
});

export default router;
