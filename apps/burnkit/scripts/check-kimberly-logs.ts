import "dotenv/config";
import { prisma } from "../src/lib/db";

async function checkKimberlyLogs() {
  const kimberlyUsers = await prisma.user.findMany({
    where: {
      name: {
        contains: "Kimberly",
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  console.log("Kimberly users found:", kimberlyUsers);

  for (const user of kimberlyUsers) {
    const count = await prisma.time_logs.count({
      where: {
        user_id: user.id,
      },
    });
    console.log(`User ${user.email} (${user.id}) has ${count} time logs`);

    // Get date range
    const logs = await prisma.time_logs.findMany({
      where: {
        user_id: user.id,
      },
      select: {
        date: true,
        minutes: true,
        is_billable: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    if (logs.length > 0) {
      console.log(
        `  Date range: ${logs[0].date.toISOString().split("T")[0]} to ${logs[logs.length - 1].date.toISOString().split("T")[0]}`
      );
      console.log(
        `  First 5 logs:`,
        logs
          .slice(0, 5)
          .map((l) => ({
            date: l.date.toISOString().split("T")[0],
            minutes: l.minutes,
            billable: l.is_billable,
          }))
      );
    }
  }

  // Total time logs in database
  const totalLogs = await prisma.time_logs.count();
  console.log(`\nTotal time logs in database: ${totalLogs}`);
}

checkKimberlyLogs();
