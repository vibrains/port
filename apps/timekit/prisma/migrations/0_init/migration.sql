-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "teamwork_company_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "google_id" TEXT NOT NULL,
    "company_id" TEXT,
    "employee_code" VARCHAR(6),
    "department_code" VARCHAR(4),
    "fnc_code" VARCHAR(10),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "teamwork_project_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "job_code" VARCHAR(30),
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_logs" (
    "id" TEXT NOT NULL,
    "teamwork_log_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "minutes" INTEGER NOT NULL,
    "description" TEXT,
    "job_number" VARCHAR(30),
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "is_billable" BOOLEAN NOT NULL DEFAULT false,
    "synced_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_job_number_cache" (
    "id" TEXT NOT NULL,
    "task_id" INTEGER NOT NULL,
    "job_number" VARCHAR(30),
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_job_number_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_job_number_cache" (
    "id" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "job_number" VARCHAR(30),
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_job_number_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exports" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "date_range_start" DATE NOT NULL,
    "date_range_end" DATE NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_teamwork_company_id_key" ON "companies"("teamwork_company_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_teamwork_project_id_key" ON "projects"("teamwork_project_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_logs_teamwork_log_id_key" ON "time_logs"("teamwork_log_id");

-- CreateIndex
CREATE INDEX "time_logs_date_user_id_project_id_idx" ON "time_logs"("date", "user_id", "project_id");

-- CreateIndex
CREATE INDEX "time_logs_user_date_idx" ON "time_logs"("user_id", "date");

-- CreateIndex
CREATE INDEX "time_logs_project_date_idx" ON "time_logs"("project_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "task_job_number_cache_task_id_key" ON "task_job_number_cache"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_job_number_cache_project_id_key" ON "project_job_number_cache"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "exports_s3_key_key" ON "exports"("s3_key");

-- CreateIndex
CREATE INDEX "exports_created_by_created_at_idx" ON "exports"("created_by", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

