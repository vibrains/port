import { NextResponse } from 'next/server';
import { MOCK_FILTERS } from '@/lib/mock-data';

// Cache this route data for 5 minutes (filters don't change frequently)
export const revalidate = 300;

export async function GET() {
  const response = NextResponse.json({ success: true, data: MOCK_FILTERS });
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return response;
}
