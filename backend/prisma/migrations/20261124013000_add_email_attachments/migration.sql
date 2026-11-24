ALTER TABLE "EmailJob"
ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]'::jsonb;
