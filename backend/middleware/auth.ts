import jwt from "jsonwebtoken";
import { Shop } from "../models/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    
    // Check subscription expiry
    const shop = await Shop.findById(user.id);
    if (shop?.subscription_expires_at && shop.subscription_expires_at < new Date()) {
      // Logic for expired subscription can be added here
    }
    
    next();
  });
};
