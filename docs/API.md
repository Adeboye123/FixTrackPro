# FixTrack Pro API Documentation

## Base URL
`/api`

## Authentication
- `POST /auth/register`: Register a new shop.
- `POST /auth/login`: Initial login (returns email/password status).
- `POST /auth/verify-otp`: Verify OTP and receive JWT token.
- `POST /auth/forgot-password`: Request password reset OTP.
- `POST /auth/reset-password`: Reset password with OTP.

## Repairs
- `GET /repairs`: List all repairs for the shop.
- `POST /repairs`: Create a new repair ticket.
- `PATCH /repairs/:id`: Update repair status or payment.
- `POST /repairs/:id/notify`: Send notification to customer.

## Inventory
- `GET /inventory`: List all inventory items.
- `POST /inventory`: Add a new item.
- `PATCH /inventory/:id`: Update stock or details.

## Staff
- `GET /staff`: List all staff members.
- `POST /staff`: Add a new staff member.

## Shop
- `PATCH /shop/profile`: Update shop details.
- `PATCH /shop/password`: Update shop password.

## Admin (Super Admin)
- `GET /admin/stats`: Global platform statistics.
- `PATCH /admin/shops/:id/plan`: Update a shop's subscription plan.
