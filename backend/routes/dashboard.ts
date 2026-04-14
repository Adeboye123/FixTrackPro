import express from "express";
import mongoose from "mongoose";
import { Repair } from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/stats", authenticateToken, async (req: any, res) => {
  const total = await Repair.countDocuments({ shop_id: req.user.id });
  const active = await Repair.countDocuments({ shop_id: req.user.id, status: { $ne: 'Delivered' } });
  const completed = await Repair.countDocuments({ shop_id: req.user.id, status: 'Completed' });
  
  const repairs = await Repair.find({ shop_id: req.user.id });
  const revenue = repairs.reduce((acc, r) => acc + (r.amount_paid || 0), 0);
  
  const pending_list = repairs
    .filter(r => (r.estimated_cost || 0) > (r.amount_paid || 0))
    .map(r => ({
      id: r._id,
      customer_name: r.customer_name,
      device_model: r.device_model,
      balance: (r.estimated_cost || 0) - (r.amount_paid || 0),
      job_id: r.job_id
    }));
  
  const pending_payments = pending_list.reduce((acc, r) => acc + r.balance, 0);
  
  const recent = await Repair.find({ shop_id: req.user.id })
    .populate('technician_id', 'name')
    .sort({ created_at: -1 })
    .limit(5);
  
  const transformedRecent = recent.map(r => ({
    ...r.toObject(),
    technician_name: (r.technician_id as any)?.name || null
  }));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const chartDataRaw = await Repair.aggregate([
    { $match: { shop_id: new mongoose.Types.ObjectId(req.user.id), created_at: { $gte: thirtyDaysAgo } } },
    { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
        revenue: { $sum: "$amount_paid" }
    }},
    { $sort: { _id: 1 } }
  ]);
  
  const chartData = chartDataRaw.map(d => ({ date: d._id, revenue: d.revenue }));
  
  res.json({ 
    total, active, completed, revenue, pending_payments, 
    pending_list,
    recent: transformedRecent, 
    chartData 
  });
});

export default router;
