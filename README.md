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

- **Smart Donor Matching** — AI-powered engine scores donors by urgency, proximity, blood compatibility, and availability
- **Blood Inventory Management** — Track stock by type, quantity, and expiry with automated tiered alerts
- **Urgency Request System** — Submit and manage blood requests with Critical / Normal urgency tagging
- **Email Notifications** — Token-based donor accept/decline emails and expiry alert emails to staff
- **Real-time Updates** — WebSocket-powered live status updates across all dashboards
- **Multi-role Authentication** — Separate flows for Donors, Hospital Staff, Receivers, and Admins with OTP email verification
- **Light / Dark Theme** — System-aware theme with manual toggle
- **PostgreSQL & Drizzle ORM** — Robust relational schema with type-safe queries and zero-config automated table creation
- **Docker Ready** — Full multi-service Docker Compose setup

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Framer Motion, Radix UI |
| **Backend** | Node.js 20, Express, TypeScript, Passport.js, Nodemailer, WebSocket |
| **Database** | PostgreSQL 16, Drizzle ORM, Zod (schema validation) |
| **DevOps** | Docker, Docker Compose, Nginx, Render (hosting) |

---

## PostgreSQL Database Tables

The database is structured into 9 core tables:

1. **`users`** — Accounts, credentials, roles (donor, hospital, receiver, admin), and approval statuses.
2. **`donors`** — Donor profiles, blood types, availability windows, coordinates, and eligibility statuses.
3. **`staff`** — Hospital staff details, affiliations, departments, positions, and ID documents.
4. **`receivers`** — Patient/receiver records, conditions, urgency levels, and hospital connections.
5. **`blood_inventory`** — Hospital blood stock units, types, quantities, and expiration dates.
6. **`blood_requests`** — Urgent and routine blood requests with location coordinates and fulfillment tracking.
7. **`donor_responses`** — Secure token-based responses (accepted/declined) to emergency notifications.
8. **`blood_expiry_alerts`** — Automated multi-level expiry alerts (Critical/Warning/Info) with acknowledgment status.
9. **`blood_donation_tracking`** — End-to-end transfusion timeline from collection to patient transfusion.

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
# Set DATABASE_URL=postgresql://postgres:password@localhost:5432/bloodflow_hub in .env

# 4. (Optional) Initialize database tables & seed sample data
npx tsx scripts/initialize-collections.ts

# 5. Start the development server
npm run dev
```

The application will be available at **http://localhost:3000** or **http://localhost:3001**

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
| **Donor** | Profile setup, donation history, respond to requests via email link |
| **Hospital Staff** | Manage inventory, approve requests, view expiry alerts and donor suggestions |
| **Receiver** | Submit blood requests, track status in real-time |
| **Admin** | Full platform oversight — users, requests, and inventory |

---

## Project Structure

```
Bloodflow-Hub/
├── client/src/
│   ├── components/      # UI components (dashboard, layout, donor, ui)
│   ├── pages/           # Route pages (Landing, Login, Dashboards)
│   ├── context/         # ThemeContext, DataContext
│   └── hooks/           # Custom React hooks
├── server/
│   ├── routes.ts        # All API endpoints
│   ├── storage.ts       # PostgreSQL / Drizzle ORM data layer
│   ├── db.ts            # PostgreSQL pool and auto-table initialization
│   ├── matchmaking.ts   # AI donor scoring engine
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
