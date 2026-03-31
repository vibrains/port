/**
 * Database Inspection Script
 *
 * This script connects to the existing PostgreSQL database and inspects
 * the schema and data to understand the structure.
 */

import "dotenv/config";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function inspectDatabase() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log("🔍 Inspecting Database");
    console.log("=".repeat(60));

    // Test connection
    const client = await pool.connect();
    console.log("✅ Database connection successful\n");

    // Get all tables
    console.log("📋 Tables in database:");
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map((r) => r.table_name);
    tables.forEach((table) => console.log(`   - ${table}`));
    console.log(`\n   Total: ${tables.length} tables\n`);

    // Inspect companies table
    if (tables.includes("companies")) {
      console.log("=".repeat(60));
      console.log("📊 Companies Table Structure:");
      console.log("=".repeat(60));

      const columnsResult = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'companies' 
        ORDER BY ordinal_position
      `);

      console.log("\nColumns:");
      columnsResult.rows.forEach((col) => {
        console.log(`   - ${col.column_name}`);
        console.log(`     Type: ${col.data_type}`);
        console.log(`     Nullable: ${col.is_nullable}`);
        if (col.column_default) {
          console.log(`     Default: ${col.column_default}`);
        }
        console.log("");
      });

      // Get sample data
      const dataResult = await client.query(`
        SELECT * FROM companies LIMIT 10
      `);

      console.log("=".repeat(60));
      console.log(`📈 Sample Data (${dataResult.rows.length} rows):`);
      console.log("=".repeat(60));

      if (dataResult.rows.length > 0) {
        console.log("\nFirst 5 companies:");
        dataResult.rows.slice(0, 5).forEach((row, i) => {
          console.log(`\n${i + 1}. Company:`);
          Object.entries(row).forEach(([key, value]) => {
            const displayValue =
              value === null
                ? "NULL"
                : value === ""
                  ? "(empty string)"
                  : String(value).substring(0, 100);
            console.log(`   ${key}: ${displayValue}`);
          });
        });

        // Get total count
        const countResult = await client.query(
          "SELECT COUNT(*) FROM companies"
        );
        console.log(
          `\n\n📊 Total companies in database: ${countResult.rows[0].count}`
        );
      } else {
        console.log("\n⚠️  No data found in companies table");
      }
    } else {
      console.log('\n⚠️  "companies" table not found in database');
      console.log("\nAvailable tables:");
      tables.forEach((table) => console.log(`   - ${table}`));
    }

    // Check for other relevant tables
    console.log("\n" + "=".repeat(60));
    console.log("🔍 Looking for other relevant tables:");
    console.log("=".repeat(60));

    const relevantTables = [
      "users",
      "projects",
      "time_entries",
      "people",
      "clients",
    ];
    for (const tableName of relevantTables) {
      if (tables.includes(tableName)) {
        const countResult = await client.query(
          `SELECT COUNT(*) FROM ${tableName}`
        );
        console.log(`✅ ${tableName}: ${countResult.rows[0].count} rows`);
      }
    }

    client.release();
    console.log("\n✨ Database inspection complete!");
  } catch (error) {
    console.error("\n❌ Database inspection failed:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.message.includes("ECONNREFUSED")) {
        console.error(
          "\n   💡 Tip: Make sure PostgreSQL is running and the DATABASE_URL is correct"
        );
      }
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the inspection
inspectDatabase();
