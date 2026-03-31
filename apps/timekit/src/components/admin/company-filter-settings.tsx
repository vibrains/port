/**
 * Company Filter Settings Component
 * Admin toggle to show all companies or restrict to Near&Dear only
 */

'use client';

import { Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCompanyFilter } from '@/lib/hooks/use-company-filter';

export function CompanyFilterSettings() {
  const { showAllCompanies, setShowAllCompanies, isLoaded, defaultCompanyName } =
    useCompanyFilter();

  if (!isLoaded) {
    return null; // Avoid hydration mismatch
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-purple-500" />
          Company Filter Settings
        </CardTitle>
        <CardDescription>Control which company data is visible in the app</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="show-all-companies" className="cursor-pointer text-base">
              Show All Companies
            </Label>
            <p className="text-muted-foreground text-sm">
              {showAllCompanies
                ? 'Viewing data from all companies'
                : `Restricted to ${defaultCompanyName} only`}
            </p>
          </div>
          <Switch
            id="show-all-companies"
            checked={showAllCompanies}
            onCheckedChange={setShowAllCompanies}
          />
        </div>

        {!showAllCompanies && (
          <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-purple-50 p-3">
            <p className="text-sm text-purple-900">
              <strong>Company Restriction Active:</strong> The entire app is currently filtered to
              show only {defaultCompanyName} data. The company filter dropdown is hidden on the
              dashboard.
            </p>
          </div>
        )}

        {showAllCompanies && (
          <div className="mt-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-3">
            <p className="text-sm text-blue-900">
              <strong>All Companies Mode:</strong> The app is showing data from all companies. You
              can use the company filter dropdown on the dashboard to filter by specific companies.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
