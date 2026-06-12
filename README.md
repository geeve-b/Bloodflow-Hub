<div align="center">

# Bloodflow Hub

### Connecting Donors. Saving Lives.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-bloodflow--hub.onrender.com-red?style=for-the-badge&logo=render&logoColor=white)](https://bloodflow-hub.onrender.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
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
- **Docker Ready** — Full multi-service Docker Compose setup

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Framer Motion, Radix UI |
| **Backend** | Node.js 20, Express, TypeScript, Passport.js, Nodemailer, WebSocket |
| **Database** | MongoDB 7, Mongoose, Zod (schema validation) |
| **DevOps** | Docker, Docker Compose, Nginx, Render (hosting) |

---

## Getting Started

### Prerequisites

- Node.js v20+, npm v10+
- MongoDB v7 (local or Atlas)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/geeve-b/Bloodflow-Hub.git
cd Bloodflow-Hub

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env   # Fill in the required values

# 4. Start the development server
npm run dev
```

The application will be available at **http://localhost:5000**

### Docker Deployment (Full Stack)

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |

---

## Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/bloodflow
SESSION_SECRET=your_secret_here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
APP_URL=http://localhost:5000
```

> **Note:** For Gmail, use a [Google App Password](https://myaccount.google.com/apppasswords) (requires 2FA to be enabled on your account).

---

## Live Demo

> **[https://bloodflow-hub.onrender.com/](https://bloodflow-hub.onrender.com/)**

Register a free account and select your role — **Donor**, **Hospital Staff**, or **Receiver** — to explore the full platform.

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
│   ├── context/         # ThemeContext
│   └── hooks/           # Custom React hooks
├── server/
│   ├── routes.ts        # All API endpoints
│   ├── storage.ts       # MongoDB data layer
│   ├── matchmaking.ts   # AI donor scoring engine
│   ├── bloodExpiryService.ts  # Expiry alerts
│   ├── email.ts         # Nodemailer email service
│   └── realtime.ts      # WebSocket handler
├── shared/
│   └── schema.ts        # Zod schemas and shared TypeScript types
├── docker-compose.yml
└── package.json
```

---

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m "feat: add your feature"`
3. Push to your branch and open a Pull Request against `main`

Bug reports and feature requests are welcome via [GitHub Issues](https://github.com/geeve-b/Bloodflow-Hub/issues).

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for full details.

---

<div align="center">

Built to save lives.

[![GitHub Stars](https://img.shields.io/github/stars/geeve-b/Bloodflow-Hub?style=social)](https://github.com/geeve-b/Bloodflow-Hub)

</div>
