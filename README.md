# ReachInbox — Full-Stack Email Job Scheduler

A production-grade email scheduling service and dashboard built with **TypeScript, Express.js, BullMQ, Redis, PostgreSQL (Prisma), Elasticsearch, Ethereal SMTP, Slack OAuth, and React + Tailwind CSS**.

## 1. Architecture Overview

1. **Scheduling & Persistence (No Cron)**:
   - Incoming batch requests (`POST /api/emails/schedule`) store individual `EmailJob` rows in PostgreSQL and enqueue delayed jobs in BullMQ (`email-send-queue`) using `jobId = emailJob.id`.
   - Redis runs with `--appendonly yes` (AOF persistence), ensuring delayed jobs survive server restarts without losing state or restarting from scratch.
   - On server startup, `recoverPendingJobsOnStartup()` reconciles any `SCHEDULED` or interrupted `PROCESSING` database records against BullMQ to guarantee zero dropped jobs and strict idempotency.

2. **Throughput, Concurrency & Rate Limiting**:
   - **Worker Concurrency**: Configurable via `WORKER_CONCURRENCY` (default `5`).
   - **Minimum Delay Between Sends**: Enforced per sender across parallel workers using an atomic Redis slot reservation (`sender:next_slot:<senderId>`), guaranteeing at least `MIN_DELAY_BETWEEN_EMAILS_MS` (default `2000ms`) between dispatches from the same sender.
   - **Hourly Rate Limiting**: Enforced atomically via a Redis Lua script (`ratelimit:sender:<senderId>:<YYYY-MM-DD-HH>`). When a sender hits `hourlyLimit`, the worker does **not** drop or fail the job—it calculates the exact milliseconds until the next UTC hour window (+ jitter) and calls `job.moveToDelayed()` + throws `DelayedError`, preserving queue order cleanly.

3. **Live Slack Alerts on Rate Limit Hit**:
   - Users connect Slack via real OAuth 2.0 (`GET /api/slack/auth-url` -> `/api/slack/callback`).
   - When a sender hits its hourly limit, a Redis `SET NX` lock triggers a single live `chat.postMessage` alert to the user's Slack channel for that hour window.

4. **Search & Queue Observability**:
   - All scheduled and sent emails are indexed into **Elasticsearch** (`reachinbox_emails`) for fuzzy multi-field search (`recipientEmail`, `subject`, `body`).
   - Live BullMQ dashboard exposed at `http://localhost:5000/admin/queues`.

---

## 2. Local Setup & Running

### Step 1: Start Infrastructure (PostgreSQL, Redis, Elasticsearch)
```bash
docker-compose up -d"# Reachinbox-Email-Scheduler" 
