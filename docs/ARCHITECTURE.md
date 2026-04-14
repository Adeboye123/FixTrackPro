# FixTrack Pro Architecture

## Overview
FixTrack Pro is a multi-tenant SaaS platform for repair shops. It allows shop owners to manage repairs, inventory, staff, and customer notifications.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Lucide Icons, Recharts, Motion (formerly Framer Motion).
- **Backend:** Node.js, Express, MongoDB (Mongoose).
- **Authentication:** JWT (JSON Web Tokens) and OTP (One-Time Password) for login.
- **Deployment:** Docker, Google Cloud Run.

## Project Structure
- `frontend/`: Public-facing website and customer portal.
- `admin/`: Shop management dashboard.
- `backend/`: API server and database logic.
- `docs/`: Technical documentation.

## Key Modules
- **Auth:** Handles registration, login, and password resets.
- **Repairs:** Core logic for tracking device repairs.
- **Inventory:** Spare parts and accessory management.
- **Staff:** Team management and performance tracking.
- **Dashboard:** Analytics and business overview.
