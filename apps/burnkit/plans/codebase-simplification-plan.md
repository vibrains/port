# Codebase Simplification Plan

**Date:** 2026-02-11
**Project:** NDOS BurnKit Financial Dashboard
**Objective:** Reduce technical debt, eliminate duplication, and simplify architecture

---

## Executive Summary

This plan addresses significant code duplication and architectural inconsistencies discovered in the BurnKit codebase. The current codebase has **~10,670 lines** with an estimated **19% duplication rate** (~2,000 lines) and **403 lines of dead code**. By following this plan, we can:

- **Reduce codebase size by 25-30%** (~2,500-3,200 lines)
- **Eliminate dual dashboard systems** (one is broken)
- **Consolidate duplicate table implementations**
- **Remove 17+ instances of duplicated business logic**
- **Establish single source of truth for calculations**
- **Improve maintainability and developer experience**

---

## Current State Assessment

### Major Issues Identified

#### 1. **Dual Dashboard Architecture** 🔴 CRITICAL
- **Main Dashboard** (`/src/app/page.tsx`): 383-line client-side component with complex state management
- **Standalone Pages** (`/clients`, `/users`, `/matrix`, `/insights`): Server-rendered RSC pages
- **Problem:** Two completely different implementations for the same functionality
- **Impact:** The standalone pages are **currently broken** (importing empty stub functions)

#### 2. **Duplicate Table Implementations** 🔴 CRITICAL
**Two parallel table systems:**
- **Home Dashboard Tables** (`/home/components/`): Custom implementation with manual sorting
  - `ClientsTable.tsx` (183 lines)
  - `UsersTable.tsx`
  - `MatrixTable.tsx`
  - `TimeLogsTable.tsx`
- **Standalone Page Tables** (`/(dashboard)/*/`): TanStack Table implementation
  - `clients-table.tsx` (152 lines)
  - `users-table.tsx`
  - `matrix-table.tsx`
- **Impact:** ~500-700 lines of duplicate code, different data formats, maintenance burden

#### 3. **Duplicated Business Logic** 🟠 HIGH
**"isInternal" logic duplicated in 17+ locations:**
```typescript
const internalKeywords = ['internal', 'moontide', 'everywhen', 'near&dear', 'bd'];
```
**Found in:**
- `/api/analytics/route.ts`
- `/api/all-companies/route.ts`
- `/api/all-projects/route.ts`
- `/home/utils/calculations.ts`
- 13+ other files

**Impact:** Changes require updates in 17+ places, high risk of inconsistency

#### 4. **Duplicate Aggregation Logic** 🟠 HIGH
- **Client-side:** `/home/utils/calculations.ts` - Full aggregation implementation
- **Server-side:** `/api/analytics/route.ts` - Near-identical aggregation
- **Active API:** `/api/time-logs` - Optimized version
- **Impact:** ~300 lines of duplication, three different approaches to same problem

#### 5. **Dead Code** 🟡 MEDIUM
- **Legacy Server Actions** (`/src/actions/data.ts`): 134 lines of empty stub functions
- **Unused API Route** (`/api/analytics`): 269 lines (deprecated by client-side calculations)
- **Migration Scripts:** 3,214 lines of one-off scripts that served their purpose
- **Impact:** 403+ lines of confusing dead code, broken imports

#### 6. **Overly Complex Hooks** 🟡 MEDIUM
- `useDashboardData.ts`: 178 lines
- `useTimeLogs.ts`: 254 lines with complex retry/abort logic
- `useFilters.ts`: 331 lines with multiple responsibilities
- **Impact:** Hard to test, difficult to maintain, coupling concerns

---

## Simplification Strategy

### Phase 1: Remove Dead Code and Broken Features (Quick Wins)
**Effort:** 2-3 hours | **Impact:** -500+ lines | **Risk:** Low

### Phase 2: Consolidate Business Logic
**Effort:** 3-4 hours | **Impact:** -300+ lines | **Risk:** Medium

### Phase 3: Choose Single Dashboard Architecture
**Effort:** 6-8 hours | **Impact:** -1,000+ lines | **Risk:** High

### Phase 4: Consolidate Table Implementations
**Effort:** 4-6 hours | **Impact:** -500+ lines | **Risk:** Medium

### Phase 5: Simplify Hook Architecture
**Effort:** 4-5 hours | **Impact:** Better maintainability | **Risk:** Medium

### Phase 6: Archive Unused Scripts
**Effort:** 1 hour | **Impact:** -3,000+ lines | **Risk:** Low

---

## Detailed Implementation Plan

## Phase 1: Remove Dead Code and Broken Features

### Task 1.1: Delete Legacy Server Actions ✅
**Files to Delete:**
- `/src/actions/data.ts` (134 lines)

**Files to Update (remove imports):**
- `/src/app/(dashboard)/clients/page.tsx`
- `/src/app/(dashboard)/users/page.tsx`
- `/src/app/(dashboard)/matrix/page.tsx`
- `/src/app/(dashboard)/insights/page.tsx`

**Validation:**
- Run `npm run build` to ensure no broken imports
- Verify no runtime errors

### Task 1.2: Delete Duplicate Analytics API ✅
**Files to Delete:**
- `/src/app/api/analytics/route.ts` (269 lines)

**Verification:**
- Search codebase for any imports/fetches to `/api/analytics`
- Confirm it's not used anywhere

**Expected Impact:** -403 lines of confusing code

---

## Phase 2: Consolidate Business Logic

### Task 2.1: Create Centralized Business Rules ✅
**Create:** `/src/lib/business-rules.ts`

```typescript
/**
 * Business rules and constants for BurnKit
 */

// Internal company identification
const INTERNAL_KEYWORDS = ['internal', 'moontide', 'everywhen', 'near&dear', 'bd'];

export function isInternalCompany(companyName: string): boolean {
  if (!companyName) return false;
  const normalized = companyName.toLowerCase().trim();
  return INTERNAL_KEYWORDS.some(keyword => normalized.includes(keyword));
}

// Rate calculations
export const AVG_HOURLY_RATE = 150;

export function calculateHourlyRate(
  totalBilled: number,
  totalBillableHours: number
): number {
  if (totalBillableHours === 0) return AVG_HOURLY_RATE;
  return totalBilled / totalBillableHours;
}

// Time entry categorization
export function categorizeTimeEntry(entry: {
  isBillable: boolean;
  isGapTime: boolean;
  companyName: string;
}): 'billable' | 'gap' | 'internal' {
  if (entry.isBillable) return 'billable';
  if (entry.isGapTime) return 'gap';
  if (isInternalCompany(entry.companyName)) return 'internal';
  return 'internal'; // fallback
}
```

### Task 2.2: Replace All Instances ✅
**Search for:** `['internal', 'moontide'` or `internalKeywords`

**Files to update (17+ locations):**
1. `/src/app/api/all-companies/route.ts`
2. `/src/app/api/all-projects/route.ts`
3. `/src/app/home/utils/calculations.ts`
4. `/src/app/home/components/InsightsCards.tsx`
5. `/src/app/home/components/TopPerformersCard.tsx`
6. All other instances found in search

**Pattern:**
```typescript
// Before
const internalKeywords = ['internal', 'moontide', 'everywhen', 'near&dear', 'bd'];
const isInternal = internalKeywords.some(k => name.toLowerCase().includes(k));

// After
import { isInternalCompany } from '@/lib/business-rules';
const isInternal = isInternalCompany(name);
```

**Validation:**
- All tests pass
- Manual verification of dashboard calculations

**Expected Impact:** -300+ lines, single source of truth for business logic

---

## Phase 3: Choose Single Dashboard Architecture

### Decision Point: Choose ONE Architecture 🔴

**Option A: Keep Main Page (Client-Heavy)**
- ✅ Currently working
- ✅ Fast, interactive UX
- ❌ Client-side heavy
- ❌ Large bundle size
- ❌ Complex state management

**Option B: Keep Standalone Pages (Server-First - RECOMMENDED)**
- ✅ Next.js 16 best practices (RSC)
- ✅ Better performance (streaming)
- ✅ Simpler state management
- ✅ Better SEO potential
- ✅ Easier caching strategies
- ❌ Requires fixing broken server actions
- ❌ More work upfront

**Recommendation:** **Option B (Server-First)** - Aligns with Next.js 16 direction

### Task 3.1: Fix Standalone Pages (Option B) ✅

#### Step 1: Create Working Server Actions
**Create:** `/src/actions/dashboard-data.ts`

```typescript
'use server';

import { db } from '@/lib/db';
import { isInternalCompany } from '@/lib/business-rules';

export async function getCompanies() {
  const companies = await db.company.findMany({
    select: {
      id: true,
      name: true,
      teamworkId: true,
    },
    orderBy: { name: 'asc' }
  });

  return companies.map(company => ({
    ...company,
    isInternal: isInternalCompany(company.name)
  }));
}

export async function getUsers() {
  return await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      teamworkId: true,
      hourlyRate: true,
    },
    orderBy: { name: 'asc' }
  });
}

export async function getProjects(companyId?: string) {
  const where = companyId ? { companyId } : {};

  return await db.project.findMany({
    where,
    select: {
      id: true,
      name: true,
      teamworkId: true,
      companyId: true,
      company: {
        select: {
          name: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}

export async function getTimeLogs(filters?: {
  startDate?: Date;
  endDate?: Date;
  companyId?: string;
  projectId?: string;
  userId?: string;
}) {
  // Implementation with Prisma query
  // Include aggregations as needed
}
```

#### Step 2: Update Standalone Pages
Update each page to use new server actions:
- `/src/app/(dashboard)/clients/page.tsx`
- `/src/app/(dashboard)/users/page.tsx`
- `/src/app/(dashboard)/matrix/page.tsx`
- `/src/app/(dashboard)/insights/page.tsx`

**Pattern:**
```typescript
// Before
import { getClients } from '@/actions/data'; // Empty stub
const clients = await getClients(); // Returns []

// After
import { getCompanies, getTimeLogs } from '@/actions/dashboard-data';
const companies = await getCompanies();
const timeLogs = await getTimeLogs();
// Perform aggregations server-side or use client component
```

#### Step 3: Simplify Main Page
**Option 3a:** Convert to landing page with links to sections
**Option 3b:** Remove entirely, make `/clients` the new home
**Option 3c:** Keep as tabbed navigation shell (minimal state)

**Recommended:** Option 3c - Keep familiar UX but remove complex state

### Task 3.2: Remove Unused Dashboard Code ✅

**If choosing Server-First approach, delete:**
- `/src/app/home/` directory (if moving to standalone pages)
- OR keep as simplified navigation shell

**Expected Impact:** -1,000+ lines depending on choice

---

## Phase 4: Consolidate Table Implementations

### Task 4.1: Standardize on TanStack Table ✅

**Reasoning:**
- More features (sorting, filtering, pagination out of box)
- Better performance for large datasets
- Industry standard
- Already have DataTable wrapper

### Task 4.2: Delete Custom Table Implementations ✅

**Files to Delete:**
- `/src/app/home/components/ClientsTable.tsx` (183 lines)
- `/src/app/home/components/UsersTable.tsx`
- `/src/app/home/components/MatrixTable.tsx`
- `/src/app/home/components/TimeLogsTable.tsx`

**Create Shared Components:**
```
/src/components/dashboard/
  ├── data-table.tsx           # Keep existing
  ├── table-columns/
  │   ├── company-columns.tsx  # Column definitions
  │   ├── user-columns.tsx
  │   ├── time-log-columns.tsx
  │   └── matrix-columns.tsx
  └── table-toolbar.tsx        # Shared filtering UI
```

### Task 4.3: Standardize Data Format ✅

**Create unified type definitions in `/src/types/dashboard.ts`:**
```typescript
export interface CompanyTableRow {
  id: string;
  name: string;
  isInternal: boolean;
  totalHours: number;
  billableHours: number;
  billablePercentage: number;
  totalRevenue: number;
  // ... other fields
}

export interface UserTableRow {
  id: string;
  name: string;
  email: string;
  totalHours: number;
  billableHours: number;
  // ... other fields
}
```

**Expected Impact:** -500+ lines, single table system, easier maintenance

---

## Phase 5: Simplify Hook Architecture

### Task 5.1: Extract Reusable Hook Utilities ✅

**Create:** `/src/hooks/use-api-fetch.ts`
```typescript
import { useState, useEffect } from 'react';

interface UseFetchOptions {
  timeout?: number;
  retries?: number;
  onError?: (error: Error) => void;
}

export function useApiFetch<T>(
  url: string | null,
  options?: UseFetchOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Implement retry logic, abort controller, timeout
  // Extracted from useTimeLogs.ts

  return { data, loading, error, refetch };
}
```

**Create:** `/src/hooks/use-pagination.ts`
```typescript
export function usePagination(totalItems: number, pageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  // Extracted from useFilters.ts

  return { currentPage, totalPages, setCurrentPage, paginatedIndices };
}
```

### Task 5.2: Simplify Existing Hooks ✅

Break down complex hooks into smaller, composable pieces:
- `useDashboardData` → Use `useApiFetch` for each endpoint
- `useTimeLogs` → Extract retry/abort logic to `useApiFetch`
- `useFilters` → Split into `useSearch`, `useSort`, `usePagination`

**Expected Impact:** Better testability, easier to understand, reusable utilities

---

## Phase 6: Archive Unused Scripts

### Task 6.1: Audit Scripts Directory ✅

**Review each script in `/scripts/` (16 files, 3,214 LOC):**
- ✅ Keep: Actively used maintenance scripts
- 📦 Archive: One-off migration scripts

**Likely to Archive:**
- `update-google-ids.ts` - One-time migration
- `populate-user-rates.ts` - One-time data fix
- `migrate-*.ts` - Old migrations
- `test-*.ts` - Debugging scripts

### Task 6.2: Create Archive ✅

**Option A:** Move to archive directory
```bash
mkdir -p scripts/archive
git mv scripts/update-google-ids.ts scripts/archive/
# etc.
```

**Option B:** Move to separate repository
```bash
# Create burnkit-migrations repo
git subtree split -P scripts -b scripts-history
```

**Keep in main `/scripts/`:**
- Active data sync scripts
- Regularly used utilities
- Production maintenance scripts

**Expected Impact:** -3,000+ lines from active codebase

---

## Implementation Timeline

### Sprint 1 (Week 1): Foundation
- **Days 1-2:** Phase 1 - Remove dead code
- **Days 3-5:** Phase 2 - Consolidate business logic
- **Risk:** Low | **Value:** High (quick wins)

### Sprint 2 (Week 2): Architecture
- **Days 1-3:** Phase 3 - Fix standalone pages
- **Days 4-5:** Phase 3 - Simplify main page
- **Risk:** High | **Value:** High (major refactor)

### Sprint 3 (Week 3): Polish
- **Days 1-3:** Phase 4 - Consolidate tables
- **Days 4-5:** Phase 5 - Simplify hooks
- **Risk:** Medium | **Value:** Medium

### Sprint 4 (Ongoing): Cleanup
- **Day 1:** Phase 6 - Archive scripts
- **Days 2-5:** Testing, bug fixes, documentation
- **Risk:** Low | **Value:** Low

**Total Estimated Time:** 15-20 development days

---

## Testing Strategy

### After Each Phase:

1. **Build Test**
   ```bash
   npm run build
   ```
   Verify no TypeScript errors, successful compilation

2. **Lint Test**
   ```bash
   npm run lint
   ```
   Ensure code quality standards

3. **Manual Testing**
   - Load each dashboard view
   - Verify data displays correctly
   - Test filtering, sorting, pagination
   - Compare calculations with previous version

4. **Regression Testing**
   - Export data before changes
   - Export data after changes
   - Compare for consistency

### Before Final Deployment:

- **Performance Testing:** Compare bundle sizes, page load times
- **Data Validation:** Spot-check aggregations against source data
- **User Acceptance:** Have stakeholders review each view

---

## Risk Mitigation

### High-Risk Areas:

1. **Phase 3 (Architecture change)**
   - **Risk:** Breaking existing functionality
   - **Mitigation:**
     - Feature flag new architecture
     - A/B test with small user group
     - Keep rollback plan ready
     - Comprehensive manual testing

2. **Phase 2 (Business logic consolidation)**
   - **Risk:** Incorrect calculations due to logic changes
   - **Mitigation:**
     - Export reference data before changes
     - Write unit tests for business rules
     - Compare outputs side-by-side

### Rollback Strategy:

```bash
# Each phase should be a separate branch
git checkout -b phase-1-dead-code
# Complete phase 1
git checkout -b phase-2-business-logic
# etc.

# If issues found, easy to rollback
git revert <commit-range>
```

---

## Success Metrics

### Quantitative:

- ✅ **Codebase Size:** Reduce by 25-30% (~2,500 lines)
- ✅ **Build Time:** Measure before/after
- ✅ **Bundle Size:** Reduce client-side JS by 15-20%
- ✅ **Code Duplication:** Eliminate 17+ instances of isInternal logic
- ✅ **Dead Code:** Remove 403+ lines

### Qualitative:

- ✅ **Maintainability:** Easier to understand and modify
- ✅ **Consistency:** Single source of truth for business logic
- ✅ **Developer Experience:** Simpler mental model
- ✅ **Code Quality:** Better organization, clearer responsibilities

---

## Future Improvements (Post-Simplification)

Once simplified, consider:

1. **Add Unit Tests:** Now easier with consolidated logic
2. **Performance Optimization:** Implement caching strategies
3. **TypeScript Strictness:** Enable strict mode, eliminate `any`
4. **Error Handling:** Consistent error boundaries and user feedback
5. **Accessibility:** Ensure WCAG 2.1 AA compliance
6. **Documentation:** Inline code comments, architecture docs

---

## Appendix

### Key Files Reference

**Current Duplications:**
- Business Logic: 17+ files contain isInternal logic
- Tables: 8 table components (2 systems)
- Aggregations: 3 different implementations
- Dead Code: 4 files (403 lines)

**Proposed New Structure:**
```
src/
├── lib/
│   ├── business-rules.ts       # NEW - Centralized logic
│   ├── aggregations.ts         # NEW - Single aggregation source
│   └── constants.ts            # NEW - App-wide constants
├── actions/
│   └── dashboard-data.ts       # NEW - Working server actions
├── hooks/
│   ├── use-api-fetch.ts        # NEW - Reusable fetch logic
│   ├── use-pagination.ts       # NEW - Extracted pagination
│   └── use-filters.ts          # SIMPLIFIED
├── components/dashboard/
│   ├── data-table.tsx          # KEEP - TanStack wrapper
│   └── table-columns/          # NEW - Column definitions
│       ├── company-columns.tsx
│       ├── user-columns.tsx
│       └── time-log-columns.tsx
└── app/
    └── (dashboard)/            # Server-first architecture
        ├── clients/
        ├── users/
        ├── matrix/
        └── insights/
```

### Dependencies to Update

None expected. This is purely refactoring existing code.

### Breaking Changes

**For Users:** None - UI/UX remains the same

**For Developers:**
- Import paths change for business logic
- Server actions have new interface
- Table components have different props

---

## Questions for Review

1. **Architecture Choice:** Confirm Option B (Server-First) for Phase 3?
2. **Main Page:** Keep as navigation shell or remove entirely?
3. **Scripts Archive:** Separate repo or subfolder?
4. **Timeline:** Is 3-4 weeks reasonable or need to compress?
5. **Feature Flag:** Should we feature-flag the new architecture?

---

**Plan Status:** Draft - Pending Review
**Next Steps:** Review with team, address questions, begin Phase 1
**Document Owner:** Claude AI
**Last Updated:** 2026-02-11
