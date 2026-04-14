import express from "express";
import app from "./app.js";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { Admin } from "./models/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = 3000;

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
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }

  // Vite Middleware for Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.resolve(__dirname, "../frontend"),
      base: "/",
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    // Production: serve built files
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
