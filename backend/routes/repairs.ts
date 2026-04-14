import express from "express";
import mongoose from "mongoose";
import { Repair, RepairLog } from "../models/index.js";
import { authenticateToken } from "../middleware/auth.js";
import { checkRepairLimit, requireFeature } from "../middleware/planMiddleware.js";
import { sendEmail } from "../services/email.js";
import { repairNotificationHtml } from "../services/emailTemplates.js";
import { sendSMS } from "../services/sms.js";

const router = express.Router();

router.post("/", authenticateToken, checkRepairLimit(), async (req: any, res) => {
  const { 
    customerName, customerPhone, deviceType, deviceModel, 
    imeiSerial, faultDescription, accessories, estimatedCost, 
    technicianId, amountPaid 
  } = req.body;
  
  const jobId = `FT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const paymentStatus = amountPaid >= estimatedCost ? 'Paid' : (amountPaid > 0 ? 'Part Payment' : 'Unpaid');

  const finalTechnicianId = (technicianId && typeof technicianId === 'object') ? (technicianId.id || technicianId._id) : technicianId;

  const repair = new Repair({
    shop_id: req.user.id,
    job_id: jobId,
    customer_name: customerName,
    customer_phone: customerPhone,
    device_type: deviceType,
    device_model: deviceModel,
    imei_serial: imeiSerial,
    fault_description: faultDescription,
    accessories,
    estimated_cost: estimatedCost,
    amount_paid: amountPaid || 0,
    payment_status: paymentStatus,
    technician_id: finalTechnicianId || null
  });
  
  await repair.save();
  
  const log = new RepairLog({
    repair_id: repair._id,
    status: 'Received',
    notes: 'Device checked in'
  });
  await log.save();

  res.status(201).json({ id: repair._id.toString(), jobId });
});

router.get("/", authenticateToken, async (req: any, res) => {
  const repairs = await Repair.find({ shop_id: req.user.id })
    .populate('technician_id', 'name')
    .sort({ created_at: -1 });
  
  const transformed = repairs.map(r => {
    const obj = r.toJSON();
    return {
      ...obj,
      technician_name: (r.technician_id as any)?.name || null
    };
  });
  
  res.json(transformed);
});

router.patch("/:id", authenticateToken, async (req: any, res) => {
  const { status, notes, technicianId, amountPaid } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid repair ID" });
  }

  const repair = await Repair.findOne({ _id: req.params.id, shop_id: req.user.id });
  if (!repair) return res.status(404).json({ error: "Repair not found" });

  const newAmountPaid = amountPaid !== undefined ? amountPaid : repair.amount_paid;
  const paymentStatus = newAmountPaid >= repair.estimated_cost ? 'Paid' : (newAmountPaid > 0 ? 'Part Payment' : 'Unpaid');

  const oldStatus = repair.status;
  const finalTechnicianId = (technicianId && typeof technicianId === 'object') ? (technicianId.id || technicianId._id) : technicianId;
  
  repair.status = status || repair.status;
  repair.notes = notes || repair.notes;
  repair.technician_id = finalTechnicianId || repair.technician_id;
  repair.amount_paid = newAmountPaid;
  repair.payment_status = paymentStatus;
  repair.updated_at = new Date();
  
  await repair.save();
  
  if (status && status !== oldStatus) {
    const log = new RepairLog({
      repair_id: repair._id,
      status: status,
      notes: notes || `Status updated to ${status}`
    });
    await log.save();
  }

  res.json({ message: "Repair updated" });
});

router.post("/:id/notify", authenticateToken, async (req: any, res) => {
  const { type } = req.body;
  const repair = await Repair.findOne({ _id: req.params.id, shop_id: req.user.id });
  if (!repair) return res.status(404).json({ error: "Repair not found" });

  if (type === 'email') {
    // Check email notification feature
    const { Shop: ShopModel } = await import("../models/index.js");
    const shop = await ShopModel.findById(req.user.id);
    const plan = shop?.subscription_plan || 'Trial';
    const emailPlans = ['Basic', 'Pro', 'Premium'];
    if (!emailPlans.includes(plan)) {
      return res.status(403).json({ error: 'Email notifications require Basic plan or higher.', code: 'PLAN_FEATURE_LOCKED', feature: 'emailNotifications', currentPlan: plan, requiredPlan: 'Basic' });
    }
    const htmlContent = repairNotificationHtml({
      customerName: repair.customer_name,
      deviceModel: repair.device_model,
      jobId: repair.job_id,
      status: repair.status,
      shopName: shop?.name,
      shopPhone: shop?.phone,
    });
    await sendEmail(
      repair.customer_phone + "@mock.com",
      `Repair Update: ${repair.job_id}`,
      `Hello ${repair.customer_name}, your ${repair.device_model} repair status is now: ${repair.status}. Thank you for choosing ${shop?.name || 'FixTrack Pro'}!`,
      htmlContent
    );
  } else {
    // Check SMS notification feature
    const { Shop: ShopModel2 } = await import("../models/index.js");
    const shop2 = await ShopModel2.findById(req.user.id);
    const plan2 = shop2?.subscription_plan || 'Trial';
    const smsPlans = ['Pro', 'Premium'];
    if (!smsPlans.includes(plan2)) {
      return res.status(403).json({ error: 'SMS notifications require Pro plan or higher.', code: 'PLAN_FEATURE_LOCKED', feature: 'smsNotifications', currentPlan: plan2, requiredPlan: 'Pro' });
    }
    try {
      await sendSMS(
        repair.customer_phone, 
        `${shop2?.name || 'FixTrack Pro'} Update: Hello ${repair.customer_name}, your ${repair.device_model} repair status is now: ${repair.status}. Thank you for choosing us! Job ID: ${repair.job_id}`
      );
    } catch(err) {
       return res.status(500).json({ error: "Failed to send SMS." });
    }
  }

  res.json({ message: "Notification sent" });
});

export default router;
