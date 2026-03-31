import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import {
  getOverviewData,
  getClientData,
  getPersonData,
} from '@/actions/dashboard-data'
import type { FilterParams } from '@/types/dashboard'

export const maxDuration = 60 // Allow up to 60 seconds for slow queries

export async function POST(request: NextRequest) {
  const filters: FilterParams = await request.json()

  try {
    // Queries now use mock data, safe to run in parallel
    const [overview, clients, people] = await Promise.all([
      getOverviewData(filters),
      getClientData(filters),
      getPersonData(filters),
    ])

    return NextResponse.json({ overview, clients, people })
  } catch (error) {
    console.error('Error fetching insights data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
