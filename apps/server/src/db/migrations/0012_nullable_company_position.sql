-- Drop NOT NULL constraints on company and position
ALTER TABLE "job_applications" ALTER COLUMN "company" DROP NOT NULL;
ALTER TABLE "job_applications" ALTER COLUMN "position" DROP NOT NULL;

-- Backfill legacy placeholder strings → NULL
UPDATE "job_applications" SET "company" = NULL WHERE "company" = 'Unknown Company';
UPDATE "job_applications" SET "position" = NULL WHERE "position" = 'Unknown Position';