import mongoose from "mongoose";

export const baseOptions = {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
};

export const schemaOptions = {
  toJSON: baseOptions,
  toObject: baseOptions,
};

const ShopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner_name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  subscription_plan: { type: String, default: 'Trial', enum: ['Trial', 'Free', 'Basic', 'Pro', 'Premium'] },
  subscription_expires_at: { type: Date },
  bank_details: {
    bank_name: { type: String },
    account_number: { type: String },
    account_name: { type: String }
  },
  address: { type: String },
  logo_url: { type: String },
  verification_code: { type: String },
  verification_code_expires_at: { type: Date },
  is_verified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const StaffSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  ranking: { type: String, default: 'Bronze' },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const RepairSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  job_id: { type: String, unique: true, required: true },
  customer_name: { type: String, required: true },
  customer_phone: { type: String, required: true },
  device_type: { type: String, required: true },
  device_model: { type: String, required: true },
  imei_serial: { type: String },
  fault_description: { type: String, required: true },
  accessories: { type: String },
  estimated_cost: { type: Number, required: true },
  amount_paid: { type: Number, default: 0 },
  payment_status: { type: String, default: 'Unpaid' },
  status: { type: String, default: 'Received' },
  technician_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', index: true },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, schemaOptions);

const RepairLogSchema = new mongoose.Schema({
  repair_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Repair', required: true },
  status: { type: String, required: true },
  notes: { type: String },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const InventorySchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  name: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, default: 0 },
  cost_price: { type: Number, default: 0 },
  selling_price: { type: Number, default: 0 },
  low_stock_threshold: { type: Number, default: 5 },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const SubscriptionSchema = new mongoose.Schema({
  shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  reference: { type: String, required: true, unique: true },
  status: { type: String, default: 'success' },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

const PlatformSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updated_at: { type: Date, default: Date.now }
}, schemaOptions);

const AdminLoginLogSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  email: { type: String, required: true },
  ip: { type: String, default: 'unknown' },
  user_agent: { type: String, default: 'unknown' },
  success: { type: Boolean, required: true },
  failure_reason: { type: String },
  created_at: { type: Date, default: Date.now }
}, schemaOptions);

export const Shop = mongoose.model("Shop", ShopSchema);
export const Admin = mongoose.model("Admin", AdminSchema);
export const Staff = mongoose.model("Staff", StaffSchema);
export const Repair = mongoose.model("Repair", RepairSchema);
export const RepairLog = mongoose.model("RepairLog", RepairLogSchema);
export const Inventory = mongoose.model("Inventory", InventorySchema);
export const Subscription = mongoose.model("Subscription", SubscriptionSchema);
export const PlatformSettings = mongoose.model("PlatformSettings", PlatformSettingsSchema);
export const AdminLoginLog = mongoose.model("AdminLoginLog", AdminLoginLogSchema);

