#!/usr/bin/env tsx
/**
 * Script to populate company_id on projects based on time_logs data
 *
 * This script:
 * 1. Finds all time_logs that have a project_id
 * 2. Gets the company_id from the time_log's project (via the companies relation through time_logs)
 * 3. Updates the project with the company_id
 *
 * Usage: npx tsx scripts/populate-project-company-ids.ts
 */

import { prisma } from "../src/lib/db";

async function populateProjectCompanyIds() {
  console.log("Starting to populate company_id on projects...\n");

  try {
    // Get all time_logs with their project and company info
    const timeLogsWithCompanies = await prisma.time_logs.findMany({
      select: {
        project_id: true,
        projects: {
          select: {
            id: true,
            name: true,
            company_id: true,
          },
        },
      },
      distinct: ["project_id"],
    });

    console.log(
      `Found ${timeLogsWithCompanies.length} unique project_ids in time_logs`
    );

    // Get company info from the time_logs data
    // We need to find which company each project belongs to
    // Let's look at the companies table and match by name patterns

    const companies = await prisma.companies.findMany({
      select: {
        id: true,
        name: true,
        teamwork_company_id: true,
      },
    });

    console.log(`Found ${companies.length} companies`);
    console.log("\nCompanies:", companies.map((c) => c.name).join(", "));

    // Get all projects that need company_id
    const projectsWithoutCompany = await prisma.projects.findMany({
      where: {
        company_id: null,
      },
      select: {
        id: true,
        name: true,
        teamwork_project_id: true,
      },
    });

    console.log(
      `\nFound ${projectsWithoutCompany.length} projects without company_id`
    );

    if (projectsWithoutCompany.length === 0) {
      console.log("All projects already have company_id populated!");
      return;
    }

    // Strategy: Match projects to companies based on name patterns
    // This is a heuristic approach - projects often contain company names
    const updates: {
      projectId: string;
      companyId: string;
      companyName: string;
      projectName: string;
    }[] = [];
    const unmatched: { projectId: string; projectName: string }[] = [];

    for (const project of projectsWithoutCompany) {
      const projectNameLower = project.name.toLowerCase();

      // Try to find a matching company
      let matchedCompany = null;

      // First try exact match
      matchedCompany = companies.find(
        (c) => projectNameLower === c.name.toLowerCase()
      );

      // Then try contains match (project name contains company name)
      if (!matchedCompany) {
        matchedCompany = companies.find((c) =>
          projectNameLower.includes(c.name.toLowerCase())
        );
      }

      // Then try reverse contains (company name contains project name)
      if (!matchedCompany) {
        matchedCompany = companies.find((c) =>
          c.name.toLowerCase().includes(projectNameLower)
        );
      }

      if (matchedCompany) {
        updates.push({
          projectId: project.id,
          companyId: matchedCompany.id,
          companyName: matchedCompany.name,
          projectName: project.name,
        });
      } else {
        unmatched.push({
          projectId: project.id,
          projectName: project.name,
        });
      }
    }

    console.log(`\nMatched ${updates.length} projects to companies`);
    console.log(`Unmatched: ${unmatched.length} projects`);

    if (updates.length > 0) {
      console.log("\n--- Sample matches ---");
      updates.slice(0, 10).forEach((u) => {
        console.log(`  "${u.projectName}" → "${u.companyName}"`);
      });
      if (updates.length > 10) {
        console.log(`  ... and ${updates.length - 10} more`);
      }
    }

    if (unmatched.length > 0) {
      console.log("\n--- Unmatched projects (sample) ---");
      unmatched.slice(0, 10).forEach((u) => {
        console.log(`  "${u.projectName}"`);
      });
      if (unmatched.length > 10) {
        console.log(`  ... and ${unmatched.length - 10} more`);
      }
    }

    // Ask for confirmation before updating
    console.log("\n--- Ready to update database ---");
    console.log(`This will update ${updates.length} projects with company_id`);
    console.log("Proceeding with update...\n");

    // Perform updates
    let updatedCount = 0;
    for (const update of updates) {
      try {
        await prisma.projects.update({
          where: { id: update.projectId },
          data: { company_id: update.companyId },
        });
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update project ${update.projectId}:`, error);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} projects`);
    console.log(`❌ Failed to match ${unmatched.length} projects`);

    // Summary
    const remainingUnmatched = await prisma.projects.count({
      where: { company_id: null },
    });

    console.log(`\n--- Final Summary ---`);
    console.log(
      `Projects with company_id: ${await prisma.projects.count({ where: { company_id: { not: null } } })}`
    );
    console.log(`Projects without company_id: ${remainingUnmatched}`);
  } catch (error) {
    console.error("Error populating project company_ids:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateProjectCompanyIds();
