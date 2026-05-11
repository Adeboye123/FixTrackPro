import express from "express";
import { Staff, Repair } from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { checkStaffLimit, requireFeature } from "../middleware/planMiddleware.js";

const router = express.Router();

router.get("/", authenticateToken, async (req: any, res) => {
  const staff = await Staff.find({ shop_id: req.user.id });
  
  const staffWithMetrics = await Promise.all(staff.map(async (s) => {
    const totalRepairs = await Repair.countDocuments({ technician_id: s._id });
    const repairs = await Repair.find({ technician_id: s._id });
    const revenueGenerated = repairs.reduce((acc, r) => acc + (r.estimated_cost || 0), 0);
    
    return {
      ...s.toObject(),
      total_repairs: totalRepairs,
      revenue_generated: revenueGenerated
    };
  }));
  
  res.json(staffWithMetrics);
});

router.post("/", authenticateToken, checkStaffLimit(), async (req: any, res) => {
  const { name, role, email, phone, ranking } = req.body;
  const s = new Staff({
    shop_id: req.user.id,
    name,
    role,
    email,
    phone,
    ranking: ranking || 'Bronze'
  });
  await s.save();
  res.status(201).json({ id: s._id.toString() });
});

// Edit staff ranking — requires Premium or Trial (editStaffRanking feature)
router.patch("/:id/ranking", authenticateToken, requireFeature('editStaffRanking'), async (req: any, res) => {
  const { ranking } = req.body;
  const validRanks = ['Bronze', 'Silver', 'Gold', 'Platinum'];

  if (!ranking || !validRanks.includes(ranking)) {
    return res.status(400).json({ error: `Invalid ranking. Must be one of: ${validRanks.join(', ')}` });
  }

  const staff = await Staff.findOne({ _id: req.params.id, shop_id: req.user.id });
  if (!staff) return res.status(404).json({ error: "Staff member not found" });

  staff.ranking = ranking;
  await staff.save();

  res.json({ message: "Staff ranking updated", staffId: staff._id, ranking });
});

// Delete staff member
router.delete("/:id", authenticateToken, async (req: any, res) => {
  const staff = await Staff.findOneAndDelete({ _id: req.params.id, shop_id: req.user.id });
  if (!staff) return res.status(404).json({ error: "Staff member not found" });
  res.json({ message: "Staff member removed" });
});

export default router;
