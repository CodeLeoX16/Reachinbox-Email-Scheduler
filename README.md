# ✉️ ReachInbox — Distributed Email Scheduling & Campaign Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-Blue-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/BullMQ-Redis-red?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

<p align="center">
  <b>A reliable, distributed email scheduling system built for intelligent campaign orchestration, controlled delivery, and scalable background processing.</b>
</p>

<p align="center">
  <a href="https://reachinbox-frontend-wckw.onrender.com"><b>🚀 Live Application</b></a> •
  <a href="https://reachinbox-backend-kazn.onrender.com/health"><b>⚡ Backend Health</b></a> •
  <a href="https://reachinbox-backend-kazn.onrender.com/admin/queues"><b>📊 Queue Dashboard</b></a>
</p>

---

## 📌 Overview

**ReachInbox** is a full-stack email scheduling and campaign orchestration platform designed to manage scheduled emails, bulk recipient lists, sender-level rate limits, and reliable background execution.

Unlike traditional applications that depend on fragile in-memory cron jobs, ReachInbox uses **BullMQ + Redis** for distributed job processing and PostgreSQL for persistent job storage.

The platform supports staggered email delivery, automatic retries, hourly sending quotas, inter-email pacing, Elasticsearch-powered fuzzy search, and real-time Slack notifications.

It is built with scalability, reliability, and fault tolerance in mind.

## ✨ Key Features

| Feature | Description |
|---|---|
| 📅 Persistent Scheduling | Schedule individual emails and bulk campaigns with specific execution times. |
| ⚙️ Distributed Job Queue | BullMQ and Redis handle delayed jobs, background processing, and retries. |
| 🚦 Rate Limiting | Enforces per-sender hourly email quotas. |
| ⏱️ Smart Email Pacing | Configurable delays between consecutive emails to control delivery frequency. |
| 🔄 Automatic Recovery | Re-enqueues pending jobs after backend restarts. |
| 📧 Hybrid Email Delivery | Mailtrap HTTPS API for cloud delivery and Ethereal SMTP for local development. |
| 📂 Bulk CSV Upload | Import multiple recipients using CSV/TXT files. |
| 🔐 Google OAuth 2.0 | Secure authentication using Google Identity Services and JWT. |
| 👥 Multi-Sender Management | Manage different sender profiles and configurations. |
| 🔍 Fuzzy Search | Elasticsearch-powered multi-field email search with PostgreSQL fallback. |
| 💬 Slack Integration | Receive campaign and delivery notifications through Slack. |
| 📊 Queue Monitoring | Inspect active, delayed, completed, and failed jobs using Bull Board. |
| 📎 Attachments | Support file attachments in email campaigns. |

---

## 🏗️ System Architecture

ReachInbox follows a distributed architecture that separates the frontend, backend APIs, background workers, persistence layer, and external integrations.

<p align="center">
  <img src="ReachInbox Email Scheduler Architecture.png" alt="ReachInbox System Architecture" width="100%" />
</p>

### Architecture Components

| Layer | Responsibility |
|---|---|
| Frontend | React dashboard, campaign composer, Google authentication |
| Backend | Express APIs, authentication, CSV processing, sender management |
| Queue Engine | Redis broker, BullMQ workers, delayed execution, rate limiting |
| Persistence | PostgreSQL with Prisma ORM |
| Search | Elasticsearch indexing and fuzzy search |
| Email Delivery | Mailtrap HTTPS API and Ethereal SMTP |
| Notifications | Slack Web API |
| Monitoring | Bull Board queue dashboard |

### 🔄 Email Processing Workflow

1. **Campaign Creation:** A user creates a campaign or uploads a CSV/TXT recipient list.
2. **Validation:** The backend validates recipient information and campaign configuration.
3. **Database Persistence:** Email jobs are stored in PostgreSQL with their scheduled execution details.
4. **Queue Management:** BullMQ receives delayed jobs through Redis.
5. **Rate Limit Verification:** The worker checks the sender's hourly quota and configured pacing interval.
6. **Email Delivery:** The worker sends emails through the configured email provider.
7. **Status Management:** Email records are updated with `SENT` or `FAILED` status.
8. **Search Indexing:** Updated email documents are indexed in Elasticsearch.
9. **Notifications:** Slack receives delivery and campaign alerts.

---

## 🚦 How Rate Limiting & Email Pacing Work

One of the most important engineering components of ReachInbox is its controlled email dispatch mechanism.

### 1. Staggered Job Scheduling

Instead of sending all emails simultaneously, jobs receive calculated delay offsets.

For example, with a 2-second minimum delay:

| Email | Scheduled Offset |
|---|---:|
| Email 1 | 0 seconds |
| Email 2 | 2 seconds |
| Email 3 | 4 seconds |
| Email 4 | 6 seconds |
| Email 5 | 8 seconds |

The scheduling logic uses:

`delay = recipientIndex × minDelayMs`

### 2. Atomic Hourly Quota

Redis maintains sender-specific hourly counters.

The worker checks the sender's quota before processing an email.

If the hourly limit is reached, the job is rescheduled for the next available hourly window instead of being discarded.

### 3. Crash Recovery

ReachInbox persists email jobs in PostgreSQL rather than relying exclusively on in-memory scheduling.

During application startup, a recovery mechanism checks pending database jobs and re-enqueues eligible jobs into BullMQ.

This improves reliability across backend restarts.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| Backend | Node.js 24, Express.js, TypeScript |
| Authentication | Google OAuth 2.0, JWT |
| Database | PostgreSQL, Prisma ORM |
| Queue Processing | BullMQ, Redis, IORedis |
| Search Engine | Elasticsearch |
| Email Services | Mailtrap HTTPS API, Nodemailer, Ethereal |
| Notifications | Slack OAuth 2.0, Slack Web API |
| Validation & Upload | Zod, Multer |
| Queue Monitoring | Bull Board |
| Deployment | Render, Docker Compose |

---

## 📁 Project Structure

```text
Reachinbox-Email-Scheduler/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── elasticsearch.ts
│   │   │   ├── env.ts
│   │   │   └── redis.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── email.controller.ts
│   │   │   ├── sender.controller.ts
│   │   │   └── slack.controller.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── upload.middleware.ts
│   │   │
│   │   ├── queue/
│   │   │   ├── bullBoard.ts
│   │   │   ├── email.processor.ts
│   │   │   └── email.queue.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── email.routes.ts
│   │   │   ├── sender.routes.ts
│   │   │   └── slack.routes.ts
│   │   │
│   │   ├── services/
│   │   │   ├── search.service.ts
│   │   │   ├── slack.service.ts
│   │   │   └── smtp.service.ts
│   │   │
│   │   ├── utils/
│   │   │   └── csvParser.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ComposeModal.tsx
│   │   │   ├── EmailDetailModal.tsx
│   │   │   ├── EmailTable.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── StatsCards.tsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── LoginPage.tsx
│   │   │
│   │   ├── services/
│   │   │   └── api.ts
│   │   │
│   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── docs/
│   └── images/
│       └── reachinbox-architecture.png
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

Follow these instructions to run ReachInbox locally.

### Prerequisites

Make sure you have installed:

- Node.js >= 20.x
- npm
- Docker and Docker Compose
- Google Cloud OAuth 2.0 Client ID

### 1. Clone the Repository

```bash
git clone https://github.com/CodeLeoX16/Reachinbox-Email-Scheduler.git

cd Reachinbox-Email-Scheduler
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

This starts the local infrastructure services:

- PostgreSQL
- Redis
- Elasticsearch

### 3. Configure the Backend

```bash
cd backend

npm install

cp .env.example .env
```

Configure your `backend/.env`:

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reachinbox

REDIS_URL=redis://localhost:6379

JWT_SECRET=your_super_secret_jwt_key

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

FRONTEND_URL=http://localhost:5173

# Optional: Production Mailtrap API configuration
MAILTRAP_API_TOKEN=
MAILTRAP_INBOX_ID=

# Queue & Pacing Configuration
WORKER_CONCURRENCY=5

MIN_DELAY_BETWEEN_EMAILS_MS=2000

DEFAULT_MAX_EMAILS_PER_HOUR_PER_SENDER=200
```

Generate Prisma Client and run database migrations:

```bash
npx prisma generate

npx prisma migrate deploy
```

Start the backend:

```bash
npm run dev
```

### 4. Configure the Frontend

Open another terminal:

```bash
cd frontend

npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api

VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

Start the frontend:

```bash
npm run dev
```

Open the application:

```text
http://localhost:5173
```

---

## 🌐 Production Deployment

ReachInbox is deployed using Render.

| Service | Platform | Deployment |
|---|---|---|
| Frontend | Render Static Site | React/Vite production build |
| Backend | Render Web Service | Node.js + Express |
| Database | Render PostgreSQL | Managed database |
| Queue Broker | Render Redis | Managed Redis |
| Search | Elasticsearch | Search integration |

### Backend Build Command

```bash
npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
```

### Backend Start Command

```bash
npm start
```

### Frontend Build Command

```bash
npm install && npm run build
```

### Frontend Publish Directory

```text
dist
```

**Note:** Configure all required production environment variables in Render. Never commit `.env` files, OAuth secrets, API tokens, or database credentials.

---

## 🔌 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Backend health check |
| POST | `/api/auth/google` | Google authentication and JWT issuance |
| GET | `/api/emails` | Retrieve emails with filtering and search |
| GET | `/api/emails/stats` | Campaign statistics |
| POST | `/api/emails/schedule` | Schedule single or bulk emails |
| GET | `/api/senders` | Retrieve sender profiles |
| GET | `/api/slack/auth` | Initiate Slack OAuth |
| GET | `/admin/queues` | Bull Board queue monitoring |

---

## 📊 Monitoring & Live Demo

| Resource | Link |
|---|---|
| 🌐 Live Frontend | [Open ReachInbox](https://reachinbox-frontend-wckw.onrender.com) |
| ⚙️ Backend Health | [Check Backend](https://reachinbox-backend-kazn.onrender.com/health) |
| 📊 Bull Board | [View Queue Dashboard](https://reachinbox-backend-kazn.onrender.com/admin/queues) |
| 💻 GitHub Repository | [View Source Code](https://github.com/CodeLeoX16/Reachinbox-Email-Scheduler) |

> **Deployment Note:** The application is hosted on Render's free tier. If the backend has been idle for more than 15 minutes, the first request may take approximately 30–50 seconds while the service wakes up.

---

## 🧠 Engineering Concepts Demonstrated

This project demonstrates practical implementation of several backend and distributed-systems concepts:

- Distributed background job processing
- Persistent delayed job scheduling
- Redis-based rate limiting
- Queue retries and recovery mechanisms
- Database transaction and persistence patterns
- REST API development
- OAuth 2.0 and JWT authentication
- Full-text search and indexing
- Asynchronous email delivery
- Third-party API integration
- Docker-based local infrastructure
- Production deployment and environment configuration

---

## 👨‍💻 Author

**Somnath Bhunia**

B.Tech – Computer Science & Engineering (Data Science)

<p>
  <a href="https://github.com/CodeLeoX16">GitHub</a> •
  <a href="https://www.linkedin.com/in/somnath-bhunia-3b300b328/">LinkedIn</a> •
  <a href="https://codeleox16somnath.netlify.app/">Portfolio</a>
</p>

---

<p align="center">
  <b>Built with ❤️ by Somnath Bhunia</b>
  <br/>
  <i>Making email scheduling smarter, more reliable, and scalable.</i>
</p>
