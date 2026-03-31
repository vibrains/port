-- Migration: Add approval_status field to time_logs
-- Replaces the boolean is_approved with a string approval_status
-- Values: 'approved', 'inreview', 'needschanges', NULL (not in approval workflow)

-- Step 1: Add the new approval_status column
ALTER TABLE "time_logs" ADD COLUMN "approval_status" VARCHAR(20);

-- Step 2: Migrate existing data
-- is_approved = true -> 'approved' (these were previously synced as "approved")
-- is_approved = false -> NULL (shouldn't exist, but handle gracefully)
UPDATE "time_logs" SET "approval_status" = 'approved' WHERE "is_approved" = true;
UPDATE "time_logs" SET "approval_status" = NULL WHERE "is_approved" = false;

-- Step 3: Drop old indexes that reference is_approved
DROP INDEX IF EXISTS "time_logs_is_approved_date_idx";
DROP INDEX IF EXISTS "time_logs_approved_date_user_idx";

-- Step 4: Drop the old is_approved column
ALTER TABLE "time_logs" DROP COLUMN "is_approved";

-- Step 5: Create new indexes for approval_status
CREATE INDEX "time_logs_approval_status_date_idx" ON "time_logs"("approval_status", "date");
CREATE INDEX "time_logs_approval_date_user_idx" ON "time_logs"("approval_status", "date", "user_id");
