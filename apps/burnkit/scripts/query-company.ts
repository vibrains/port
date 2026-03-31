#!/usr/bin/env tsx
/**
 * Query company by ID and show results in a table
 */

import { prisma } from "../src/lib/db";

const COMPANY_ID = "8028d8f2-0c3b-486f-97e6-bf1091a17a36";

async function queryCompany() {
  console.log(`Querying company: ${COMPANY_ID}\n`);

  try {
    // Get company details
    const company = await prisma.companies.findUnique({
      where: { id: COMPANY_ID },
    });

    if (!company) {
      console.log("Company not found!");
      return;
    }

    console.log("=".repeat(70));
    console.log("COMPANY DETAILS");
    console.log("=".repeat(70));
    console.table({
      ID: company.id,
      Name: company.name,
      "Teamwork Company ID": company.teamwork_company_id,
      "Created At": company.created_at.toISOString(),
      "Updated At": company.updated_at.toISOString(),
    });

    // Get projects for this company
    const projects = await prisma.projects.findMany({
      where: { company_id: COMPANY_ID },
      orderBy: { name: "asc" },
    });

    console.log("\n" + "=".repeat(70));
    console.log(`PROJECTS (${projects.length})`);
    console.log("=".repeat(70));

    if (projects.length > 0) {
      console.table(
        projects.map((p) => ({
          ID: p.id,
          Name: p.name,
          "Teamwork Project ID": p.teamwork_project_id,
          "Job Code": p.job_code || "N/A",
          Created: p.created_at.toISOString().split("T")[0],
        }))
      );
    } else {
      console.log("No projects found for this company.");
    }

    // Get users for this company
    const users = await prisma.user.findMany({
      where: { company_id: COMPANY_ID, deleted_at: null },
      orderBy: { name: "asc" },
    });

    console.log("\n" + "=".repeat(70));
    console.log(`USERS (${users.length})`);
    console.log("=".repeat(70));

    if (users.length > 0) {
      console.table(
        users.map((u) => ({
          ID: u.id,
          Name: u.name,
          Email: u.email,
          "User Rate": u.user_rate
            ? `$${(u.user_rate / 100).toFixed(2)}/hr`
            : "N/A",
          Department: u.department_code || "N/A",
        }))
      );
    } else {
      console.log("No users found for this company.");
    }

    // Get time logs summary for this company (billable vs non-billable)
    const timeLogsSummary = await prisma.time_logs.groupBy({
      by: ["project_id", "is_billable"],
      where: {
        projects: {
          company_id: COMPANY_ID,
        },
      },
      _sum: {
        minutes: true,
      },
      _count: {
        id: true,
      },
    });

    console.log("\n" + "=".repeat(70));
    console.log(
      `TIME LOGS SUMMARY BY PROJECT (${timeLogsSummary.length} entries)`
    );
    console.log("=".repeat(70));

    if (timeLogsSummary.length > 0) {
      // Get project names
      const projectIds = [...new Set(timeLogsSummary.map((t) => t.project_id))];
      const projectMap = new Map(
        (
          await prisma.projects.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, name: true },
          })
        ).map((p) => [p.id, p.name])
      );

      console.table(
        timeLogsSummary.map((t) => ({
          Project: projectMap.get(t.project_id) || "Unknown",
          Type: t.is_billable ? "Billable" : "Non-Billable",
          "Total Hours": ((t._sum.minutes || 0) / 60).toFixed(1),
          "Log Count": t._count.id,
        }))
      );

      // Also show aggregated by project (combined billable + non-billable)
      console.log("\n" + "=".repeat(70));
      console.log("AGGREGATED BY PROJECT");
      console.log("=".repeat(70));

      const aggregated = new Map();
      timeLogsSummary.forEach((t) => {
        const existing = aggregated.get(t.project_id) || {
          billableHours: 0,
          nonBillableHours: 0,
          totalHours: 0,
        };
        const hours = (t._sum.minutes || 0) / 60;
        if (t.is_billable) {
          existing.billableHours += hours;
        } else {
          existing.nonBillableHours += hours;
        }
        existing.totalHours += hours;
        aggregated.set(t.project_id, existing);
      });

      console.table(
        [...aggregated.entries()].map(([projectId, data]) => ({
          Project: projectMap.get(projectId) || "Unknown",
          "Billable Hrs": data.billableHours.toFixed(1),
          "Non-Billable Hrs": data.nonBillableHours.toFixed(1),
          "Total Hrs": data.totalHours.toFixed(1),
          "Billable %":
            data.totalHours > 0
              ? ((data.billableHours / data.totalHours) * 100).toFixed(1) + "%"
              : "0%",
        }))
      );
    } else {
      console.log("No time logs found for this company.");
    }
  } catch (error) {
    console.error("Error querying company:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

queryCompany();
