import "dotenv/config";
import { prisma } from '../src/lib/db'

async function checkMatrixAggregation() {
  // Get all time logs for Kimberly Boelk (moontide user with 113 logs)
  const kimberlyUserId = '901b4a97-30b5-4222-917f-a6405641ab30'
  
  const timeLogs = await prisma.time_logs.findMany({
    where: {
      user_id: kimberlyUserId
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          department_code: true,
        },
      },
      projects: {
        select: {
          id: true,
          name: true,
          job_code: true,
          company_id: true,
          companies: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  })
  
  console.log(`Total time logs for Kimberly: ${timeLogs.length}`)
  
  // Aggregate by client (project) like the API does
  const clientMap = new Map<string, number>()
  
  timeLogs.forEach((log) => {
    const clientName = log.projects.name
    clientMap.set(clientName, (clientMap.get(clientName) || 0) + 1)
  })
  
  console.log(`\nUnique clients/projects: ${clientMap.size}`)
  console.log('Client distribution:')
  for (const [client, count] of clientMap.entries()) {
    console.log(`  ${client}: ${count} logs`)
  }
  
  // Check if there are any date filters being applied
  console.log(`\nDate range: ${timeLogs[timeLogs.length - 1]?.date.toISOString().split('T')[0]} to ${timeLogs[0]?.date.toISOString().split('T')[0]}`)
  
  // Check for unique matrix combinations (person + client)
  const matrixMap = new Map<string, number>()
  timeLogs.forEach((log) => {
    const key = `${log.users.name}|${log.projects.name}`
    matrixMap.set(key, (matrixMap.get(key) || 0) + 1)
  })
  
  console.log(`\nUnique person-client combinations (matrix entries): ${matrixMap.size}`)
}

checkMatrixAggregation()
