/**
 * Home Page
 * Frontend Lead Agent - Phase 1
 *
 * Root page that redirects to appropriate location
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard (layout will handle auth check)
  redirect('/dashboard');
}
