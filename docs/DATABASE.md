# FixTrack Pro Database Schema

## Models

### Shop
- `name`: String (required)
- `ownerName`: String (required)
- `email`: String (required, unique)
- `phone`: String
- `password`: String (hashed)
- `address`: String
- `subscription_plan`: String (Basic, Pro, Premium)
- `is_active`: Boolean

### Repair
- `shop_id`: ObjectId (ref: Shop)
- `customer_name`: String (required)
- `customer_phone`: String (required)
- `device_model`: String (required)
- `issue`: String (required)
- `status`: String (Pending, In Progress, Completed, Delivered)
- `estimated_cost`: Number
- `amount_paid`: Number
- `technician_id`: ObjectId (ref: Staff)
- `created_at`: Date

### Inventory
- `shop_id`: ObjectId (ref: Shop)
- `name`: String (required)
- `category`: String
- `quantity`: Number
- `cost_price`: Number
- `selling_price`: Number
- `low_stock_threshold`: Number

### Staff
- `shop_id`: ObjectId (ref: Shop)
- `name`: String (required)
- `role`: String
- `email`: String
- `phone`: String
- `ranking`: String (Bronze, Silver, Gold, Platinum)

### Admin (Super Admin)
- `name`: String
- `email`: String (unique)
- `password`: String (hashed)
