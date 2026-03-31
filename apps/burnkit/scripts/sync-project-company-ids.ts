#!/usr/bin/env tsx
/**
 * Teamwork-based Project-Company Sync Script
 *
 * This script syncs projects.company_id from Teamwork API data:
 * 1. Fetches projects from Teamwork API
 * 2. Maps Teamwork project ID → Teamwork company ID
 * 3. Maps Teamwork company ID → local companies.id (via teamwork_company_id)
 * 4. Updates projects.company_id with the matched local company ID
 *
 * Usage:
 *   DRY_RUN=true npx tsx scripts/sync-project-company-ids.ts    # Preview changes
 *   npx tsx scripts/sync-project-company-ids.ts                  # Apply changes
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";

const TEAMWORK_API_KEY = process.env.TEAMWORK_API_KEY;
const TEAMWORK_SITE_NAME = process.env.TEAMWORK_SITE_NAME;
const DRY_RUN = process.env.DRY_RUN === "true";

if (!TEAMWORK_API_KEY || !TEAMWORK_SITE_NAME) {
  console.error("❌ Missing required environment variables:");
  console.error(
    "   TEAMWORK_API_KEY and TEAMWORK_SITE_NAME must be set in .env"
  );
  process.exit(1);
}

const BASE_URL = `https://${TEAMWORK_SITE_NAME}.teamwork.com`;

interface TeamworkProject {
  id: number;
  name: string;
  companyId?: number;
  company?: {
    id: number;
    name: string;
  };
}

async function makeRequest<T>(endpoint: string): Promise<T> {
  const url = new URL(endpoint, BASE_URL);

  const authString = Buffer.from(`${TEAMWORK_API_KEY}:X`).toString("base64");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${authString}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  return response.json() as Promise<T>;
}

async function syncProjectCompanyIds() {
  console.log("🔄 Teamwork Project-Company Sync");
  console.log("=".repeat(60));
  console.log(`Site: ${TEAMWORK_SITE_NAME}.teamwork.com`);
  console.log(
    `Mode: ${DRY_RUN ? "DRY RUN (preview only)" : "LIVE (will update)"}`
  );
  console.log("=".repeat(60));

  try {
    // Step 1: Check data coverage in local database
    console.log("\n📊 Step 1: Checking local database coverage...");

    const projectStats = await prisma.$queryRaw<
      Array<{
        total_projects: bigint;
        null_company_id: bigint;
        filled_company_id: bigint;
      }>
    >`
      SELECT
        COUNT(*) AS total_projects,
        COUNT(*) FILTER (WHERE company_id IS NULL) AS null_company_id,
        COUNT(*) FILTER (WHERE company_id IS NOT NULL) AS filled_company_id
      FROM projects
    `;

    console.log(`   Projects total: ${projectStats[0].total_projects}`);
    console.log(`   With company_id: ${projectStats[0].filled_company_id}`);
    console.log(`   Without company_id: ${projectStats[0].null_company_id}`);

    const companyStats = await prisma.$queryRaw<
      Array<{
        companies_total: bigint;
        companies_missing_teamwork_id: bigint;
      }>
    >`
      SELECT
        COUNT(*) AS companies_total,
        COUNT(*) FILTER (WHERE teamwork_company_id IS NULL) AS companies_missing_teamwork_id
      FROM companies
    `;

    console.log(`\n   Companies total: ${companyStats[0].companies_total}`);
    console.log(
      `   Missing teamwork_company_id: ${companyStats[0].companies_missing_teamwork_id}`
    );

    const projectTeamworkStats = await prisma.$queryRaw<
      Array<{
        projects_total: bigint;
        projects_missing_teamwork_id: bigint;
      }>
    >`
      SELECT
        COUNT(*) AS projects_total,
        COUNT(*) FILTER (WHERE teamwork_project_id IS NULL) AS projects_missing_teamwork_id
      FROM projects
    `;

    console.log(
      `\n   Projects total: ${projectTeamworkStats[0].projects_total}`
    );
    console.log(
      `   Missing teamwork_project_id: ${projectTeamworkStats[0].projects_missing_teamwork_id}`
    );

    // Step 2: Fetch all projects from Teamwork API
    console.log("\n📡 Step 2: Fetching projects from Teamwork API...");

    const teamworkData = await makeRequest<{ projects: TeamworkProject[] }>(
      "/projects.json?pageSize=500&status=all"
    );

    const teamworkProjects = teamworkData.projects || [];
    console.log(`   Found ${teamworkProjects.length} projects in Teamwork`);

    // Build mapping: Teamwork project ID → Teamwork company ID
    const teamworkProjectToCompany = new Map<number, number>();
    const sampleProjects: TeamworkProject[] = [];
    for (const project of teamworkProjects) {
      // Normalize IDs to numbers
      const projectId = Number(project.id);
      const companyId = Number(project.companyId ?? project.company?.id);

      if (Number.isFinite(projectId) && Number.isFinite(companyId)) {
        teamworkProjectToCompany.set(projectId, companyId);
      }
      if (sampleProjects.length < 3) {
        sampleProjects.push(project);
      }
    }

    console.log(
      `   Built mapping for ${teamworkProjectToCompany.size} projects with company associations`
    );
    console.log("\n   Sample Teamwork projects:");
    sampleProjects.forEach((p) => {
      console.log(
        `     - ID: ${p.id} (type: ${typeof p.id}), Name: "${p.name}", company.id: ${p.company?.id} (type: ${typeof p.company?.id})`
      );
    });

    // Debug: Show what's in the map for sample IDs
    console.log("\n   Sample mapping lookups:");
    sampleProjects.forEach((p) => {
      const normalizedId = Number(p.id);
      const mapped = teamworkProjectToCompany.get(normalizedId);
      console.log(
        `     teamworkProjectToCompany.get(${normalizedId}) = ${mapped}`
      );
    });

    // Diagnostic: Show types
    const firstKey = teamworkProjectToCompany.keys().next().value;
    console.log(
      `\n   Diagnostic: First map key type: ${typeof firstKey}, value: ${firstKey}`
    );

    // Step 3: Build local mapping: Teamwork company ID → local companies.id
    console.log("\n🗂️  Step 3: Building local company mappings...");

    const localCompanies = await prisma.companies.findMany({
      select: {
        id: true,
        teamwork_company_id: true,
        name: true,
      },
    });

    const teamworkToLocalCompany = new Map<number, string>();
    for (const company of localCompanies) {
      if (company.teamwork_company_id) {
        teamworkToLocalCompany.set(company.teamwork_company_id, company.id);
      }
    }

    console.log(
      `   Found ${localCompanies.length} local companies, ${teamworkToLocalCompany.size} with teamwork_company_id`
    );

    // Step 4: Get all local projects that need company_id
    console.log("\n📋 Step 4: Analyzing local projects...");

    const localProjects = await prisma.projects.findMany({
      where: {
        company_id: null,
        teamwork_project_id: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        teamwork_project_id: true,
      },
    });

    console.log(
      `   Found ${localProjects.length} local projects without company_id but with teamwork_project_id`
    );

    // Debug: Check if local project IDs exist in Teamwork
    const sampleLocalProjectIds = localProjects
      .slice(0, 5)
      .map((p) => Number(p.teamwork_project_id));
    console.log("\n   Checking sample local project IDs in Teamwork mapping:");
    for (const id of sampleLocalProjectIds) {
      const hasMapping = teamworkProjectToCompany.has(id);
      console.log(
        `     teamwork_project_id ${id} (type: ${typeof id}): ${hasMapping ? "found" : "NOT FOUND"}`
      );
    }

    // Diagnostic: Show sample local ID type
    if (localProjects.length > 0) {
      const sampleLocalId = localProjects[0].teamwork_project_id;
      console.log(
        `\n   Diagnostic: Sample local teamwork_project_id type: ${typeof sampleLocalId}, value: ${sampleLocalId}`
      );
    }

    // Step 5: Match and prepare updates
    console.log("\n🔗 Step 5: Matching projects to companies...");

    const updates: {
      projectId: string;
      projectName: string;
      companyId: string;
      teamworkProjectId: number;
      teamworkCompanyId: number;
    }[] = [];

    const unmatched: {
      projectId: string;
      projectName: string;
      teamworkProjectId: number;
      reason: string;
    }[] = [];

    for (const project of localProjects) {
      const teamworkProjectId = Number(project.teamwork_project_id);
      const teamworkCompanyId = teamworkProjectToCompany.get(teamworkProjectId);

      if (!teamworkCompanyId) {
        unmatched.push({
          projectId: project.id,
          projectName: project.name,
          teamworkProjectId,
          reason: "No company found in Teamwork for this project",
        });
        continue;
      }

      const localCompanyId = teamworkToLocalCompany.get(teamworkCompanyId);

      if (!localCompanyId) {
        unmatched.push({
          projectId: project.id,
          projectName: project.name,
          teamworkProjectId,
          reason: `Teamwork company ${teamworkCompanyId} not found in local companies`,
        });
        continue;
      }

      updates.push({
        projectId: project.id,
        projectName: project.name,
        companyId: localCompanyId,
        teamworkProjectId,
        teamworkCompanyId,
      });
    }

    console.log(`   ✅ Matchable: ${updates.length} projects`);
    console.log(`   ❌ Unmatched: ${unmatched.length} projects`);

    // Show sample matches
    if (updates.length > 0) {
      console.log("\n--- Sample matches ---");
      updates.slice(0, 5).forEach((u) => {
        console.log(
          `   "${u.projectName}" → company_id ${u.companyId} (Teamwork company: ${u.teamworkCompanyId})`
        );
      });
      if (updates.length > 5) {
        console.log(`   ... and ${updates.length - 5} more`);
      }
    }

    // Show sample unmatched
    if (unmatched.length > 0) {
      console.log("\n--- Sample unmatched ---");
      unmatched.slice(0, 5).forEach((u) => {
        console.log(`   "${u.projectName}" - ${u.reason}`);
      });
      if (unmatched.length > 5) {
        console.log(`   ... and ${unmatched.length - 5} more`);
      }
    }

    // Step 6: Apply updates (or dry run)
    console.log("\n💾 Step 6: Applying updates...");

    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would update ${updates.length} projects`);
      console.log("   No changes made to database.");
    } else {
      let updatedCount = 0;
      let errorCount = 0;

      for (const update of updates) {
        try {
          await prisma.projects.update({
            where: { id: update.projectId },
            data: { company_id: update.companyId },
          });
          updatedCount++;
        } catch (error) {
          console.error(
            `   Failed to update project ${update.projectId}:`,
            error
          );
          errorCount++;
        }
      }

      console.log(`   ✅ Successfully updated: ${updatedCount}`);
      if (errorCount > 0) {
        console.log(`   ❌ Errors: ${errorCount}`);
      }
    }

    // Final summary
    console.log("\n📈 Final Summary");
    console.log("-".repeat(40));

    const finalStats = await prisma.$queryRaw<
      Array<{
        with_company: bigint;
        without_company: bigint;
      }>
    >`
      SELECT
        COUNT(*) FILTER (WHERE company_id IS NOT NULL) AS with_company,
        COUNT(*) FILTER (WHERE company_id IS NULL) AS without_company
      FROM projects
    `;

    console.log(`Projects with company_id: ${finalStats[0].with_company}`);
    console.log(
      `Projects without company_id: ${finalStats[0].without_company}`
    );

    if (DRY_RUN && updates.length > 0) {
      console.log("\n📝 To apply these changes, run without DRY_RUN=true");
    }
  } catch (error) {
    console.error("\n❌ Error during sync:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
syncProjectCompanyIds();
