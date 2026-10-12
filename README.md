<div align="center">

# Bloodflow Hub

### Connecting Donors. Saving Lives.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-bloodflow--hub.onrender.com-red?style=for-the-badge&logo=render&logoColor=white)](https://bloodflow-hub.onrender.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**Bloodflow Hub** is a full-stack, real-time blood donation management platform that intelligently connects blood donors, hospitals, and patients — streamlining urgent requests, inventory management, and donor matchmaking in one unified system.

</div>

---

## Overview

Bloodflow Hub bridges the critical gap between blood donors and those who urgently need it. The platform provides a real-time ecosystem that handles the full lifecycle of blood donation — from donor registration to inventory tracking and expiry alerts.

---

## Key Features

- **Smart Donor Matching** — Scores donors by urgency, proximity, blood compatibility, and donation eligibility
- **Blood Inventory Management** — Track stock by type, quantity, and expiry; fulfilling a request deducts the units used
- **Donation Recording** — Hospitals log donations, which update the donor's history, badges, and 56-day eligibility and add the units to inventory
- **Urgency Request System** — Submit and manage blood requests with Critical / Normal urgency tagging
- **Inter-hospital Sharing** — Hospitals can request blood from, and supply blood to, other hospitals
- **Email Notifications** — Eligible, compatible donors are emailed when a request is approved; staff get blood-expiry alerts (checked every 6 hours)
- **Real-time Updates** — Authenticated WebSocket updates across dashboards
- **Secure Multi-role Accounts** — Session-cookie auth with role-based API access, OTP email verification, and admin approval for hospitals
- **Light / Dark Theme** — System-aware theme with manual toggle
- **PostgreSQL & Drizzle ORM** — Robust relational schema with type-safe queries and zero-config automated table creation
- **Docker Ready** — Full multi-service Docker Compose setup

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Radix UI |
| **Backend** | Node.js 20, Express, TypeScript, Nodemailer, WebSocket (ws) |
| **Database** | PostgreSQL 16, Drizzle ORM, Zod (schema validation) |
| **DevOps** | Docker, Docker Compose, Nginx, Render (hosting) |

---

## PostgreSQL Database Tables

The database is structured into 10 tables (all created automatically on startup):

1. **`users`** — Accounts, credentials, roles (donor, hospital, receiver, admin), and approval statuses.
2. **`donors`** — Donor profiles, blood types, availability windows, coordinates, and eligibility statuses.
3. **`staff`** — Hospital staff details, affiliations, departments, positions, and ID documents.
4. **`receivers`** — Patient/receiver records, conditions, urgency levels, and hospital connections.
5. **`blood_inventory`** — Hospital blood stock units, types, quantities, and expiration dates.
6. **`blood_requests`** — Urgent and routine blood requests with location coordinates and fulfillment tracking.
7. **`donor_responses`** — Reserved for donor responses to notifications (not yet used by the app).
8. **`blood_expiry_alerts`** — Automated multi-level expiry alerts (Critical/Warning/Info) with acknowledgment status.
9. **`blood_donation_tracking`** — Recorded donations and their timeline from collection to transfusion.
10. **`inter_hospital_requests`** — Blood requests between hospitals and their accept/reject status.

---

## Getting Started

### Prerequisites

- Node.js v20+, npm v10+
- PostgreSQL v14+ (Local, Docker, Neon, Supabase, etc.)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/geeve-b/Bloodflow-Hub.git
cd Bloodflow-Hub

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env   # then set DATABASE_URL, SESSION_SECRET and SMTP_* values

# 4. (Optional) Create the database tables ahead of time (the server also does this on startup)
npx tsx scripts/initialize-collections.ts

# 5. Start the development server
npm run dev
```

The app (API and client) is served on the `PORT` from `.env` — **http://localhost:3001** with the example config.

Without SMTP settings, emails go to a temporary [Ethereal](https://ethereal.email) inbox; run with `LOG_LEVEL=debug` to see verification codes and preview links in the server log.

### Docker Deployment (Full Stack)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| PostgreSQL | localhost:5432 |

---

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bloodflow_hub
PORT=3001
APP_URL=http://localhost:3000

# Authentication
SESSION_SECRET=a-long-random-string   # signs login sessions; keep it secret and stable
ADMIN_EMAIL=bloodflowhub@gmail.com     # the account with this email is the administrator

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=bloodflowhub@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=bloodflowhub@gmail.com
SMTP_FROM_NAME=LifeFlow - Blood Donation Hub
```

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Donor** | Search blood availability, request blood, view donation history, badges, and eligibility |
| **Hospital Staff** | Manage inventory, record donations, approve/fulfil requests, inter-hospital sharing, expiry alerts, donor suggestions. Requires admin approval after registration. |
| **Receiver** | Submit blood requests and track their status |
| **Admin** | Approve hospitals, manage users, oversee requests, inventory, and analytics |

---

## Project Structure

```
Bloodflow-Hub/
├── client/src/
│   ├── components/      # UI components (dashboard, layout, donor, ui)
│   ├── pages/           # Route pages (Landing, Login, Dashboards)
│   ├── context/         # AuthContext, ThemeContext
│   └── hooks/           # Custom React hooks
├── server/
│   ├── routes.ts        # All API endpoints
│   ├── auth.ts          # Session cookies and role-based access control
│   ├── donationHistory.ts  # Donation recording, history, and certificates
│   ├── storage.ts       # PostgreSQL / Drizzle ORM data layer
│   ├── db.ts            # PostgreSQL pool and auto-table initialization
│   ├── matchmaking.ts   # Donor scoring engine
│   ├── bloodExpiryService.ts  # Expiry alerts
│   ├── email.ts         # Nodemailer email service
│   └── realtime.ts      # WebSocket handler
├── shared/
│   └── schema.ts        # PostgreSQL Drizzle tables, Zod schemas, and TypeScript types
├── docker-compose.yml
└── package.json
```

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for full details.
