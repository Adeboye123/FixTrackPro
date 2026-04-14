import express from "express";
import mongoose from "mongoose";
import { Inventory } from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireFeature } from "../middleware/planMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, requireFeature('inventory'), async (req: any, res) => {
  const items = await Inventory.find({ shop_id: req.user.id });
  res.json(items);
});

router.post("/", authenticateToken, requireFeature('inventory'), async (req: any, res) => {
  const { name, category, quantity, costPrice, sellingPrice, lowStockThreshold } = req.body;
  const item = new Inventory({
    shop_id: req.user.id,
    name,
    category,
    quantity,
    cost_price: costPrice,
    selling_price: sellingPrice,
    low_stock_threshold: lowStockThreshold
  });
  await item.save();
  res.status(201).json({ id: item._id.toString() });
});

router.patch("/:id", authenticateToken, async (req: any, res) => {
  const { quantity, sellingPrice } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid inventory ID" });
  }
  await Inventory.findOneAndUpdate(
    { _id: req.params.id, shop_id: req.user.id },
    { quantity, selling_price: sellingPrice }
  );
  res.json({ message: "Inventory updated" });
});

export default router;
