/**
 * Company Filter Hook
 * Manages the "Show All Companies" setting and Near&Dear restriction
 */

'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'timekit_show_all_companies';
const DEFAULT_COMPANY_ID = 'comp-001'; // Apex Digital (mock)
const DEFAULT_COMPANY_NAME = 'Apex Digital';

export function useCompanyFilter() {
  const [showAllCompanies, setShowAllCompanies] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === 'true' : true;
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Save setting to localStorage when changed
  const toggleShowAllCompanies = (value: boolean) => {
    setShowAllCompanies(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  return {
    showAllCompanies,
    setShowAllCompanies: toggleShowAllCompanies,
    isLoaded,
    defaultCompanyId: DEFAULT_COMPANY_ID,
    defaultCompanyName: DEFAULT_COMPANY_NAME,
  };
}
