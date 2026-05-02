import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import repairRoutes from "./routes/repairs.js";
import inventoryRoutes from "./routes/inventory.js";
import staffRoutes from "./routes/staff.js";
import dashboardRoutes from "./routes/dashboard.js";
import shopRoutes from "./routes/shop.js";
import adminRoutes from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS: allow Vercel frontend in production, open in dev
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // In dev (no FRONTEND_URL set), allow all origins
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(morgan("dev"));
app.use(express.json());

// Serve uploaded files (logos, etc.)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/repairs", repairRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
