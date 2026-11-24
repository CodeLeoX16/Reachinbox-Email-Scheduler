-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "googleId" TEXT,
    "slackAccessToken" TEXT,
    "slackChannelId" TEXT,
    "slackChannelName" TEXT,
    "slackTeamName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sender" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "smtpHost" TEXT NOT NULL DEFAULT 'smtp.ethereal.email',
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "smtpUser" TEXT NOT NULL,
    "smtpPass" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailJob" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "delayMs" INTEGER NOT NULL DEFAULT 2000,
    "hourlyLimit" INTEGER NOT NULL DEFAULT 200,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "previewUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Sender_userId_email_key" ON "Sender"("userId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailJob_idempotencyKey_key" ON "EmailJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EmailJob_userId_status_idx" ON "EmailJob"("userId", "status");

-- CreateIndex
CREATE INDEX "EmailJob_scheduledAt_idx" ON "EmailJob"("scheduledAt");

-- AddForeignKey
ALTER TABLE "Sender" ADD CONSTRAINT "Sender_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailJob" ADD CONSTRAINT "EmailJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailJob" ADD CONSTRAINT "EmailJob_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Sender"("id") ON DELETE CASCADE ON UPDATE CASCADE;
