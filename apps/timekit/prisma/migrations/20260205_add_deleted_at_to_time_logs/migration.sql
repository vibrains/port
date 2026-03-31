-- AlterTable
ALTER TABLE "time_logs" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "time_logs_deleted_at_idx" ON "time_logs"("deleted_at");
