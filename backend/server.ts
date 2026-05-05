import express from "express";
import app from "./app.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { Admin } from "./models/index.js";
import { startSubscriptionCron } from "./services/subscriptionCron.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = parseInt(process.env.PORT || "3000", 10);

async function startServer() {
  // Connect to MongoDB
  try {
    if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

     // Create default super admin if not exists
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASS = process.env.ADMIN_PASS;
    const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASS, 10);
      await new Admin({
        name: 'Super Admin',
        email: ADMIN_EMAIL,
        password: hashedPassword
      }).save();
      console.log("Default super admin created");
    }

    // Start subscription expiry cron job
    startSubscriptionCron();

    // ── Security Checks ──
    const jwtSecret = process.env.JWT_SECRET || "";
    const weakSecrets = ["default_secret", "This_is_my_token_secret_key", "secret", "jwt_secret", ""];
    if (weakSecrets.includes(jwtSecret) || jwtSecret.length < 32) {
      console.warn("\n⚠️  ══════════════════════════════════════════════════════════════");
      console.warn("⚠️  WARNING: Your JWT_SECRET is weak or using a default value!");
      console.warn("⚠️  This is a SECURITY RISK — especially since real payments");
      console.warn("⚠️  flow through the admin dashboard.");
      console.warn("⚠️  Generate a strong secret: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
      console.warn("⚠️  ══════════════════════════════════════════════════════════════\n");
    }

  } catch (err) {
    console.error("MongoDB connection error:", err);
  }

  // In split deployment (Vercel + Render), the frontend is served by Vercel.
  // Only serve frontend files if they exist (for local production testing).
  const distPath = path.join(__dirname, "../dist");
  if (process.env.NODE_ENV === "production" && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else if (process.env.NODE_ENV !== "production") {
    // Dev mode: use Vite middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      root: path.resolve(__dirname, "../frontend"),
      base: "/",
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
