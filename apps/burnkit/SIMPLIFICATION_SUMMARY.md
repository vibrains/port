# BurnKit Codebase Simplification - Executive Summary

## Overview
The BurnKit codebase has grown organically and now contains significant technical debt. This summary outlines the key findings and recommended approach to simplification.

## Key Findings

### Current State
- **Total Code:** ~10,670 lines
- **Duplicate Code:** ~2,000 lines (19%)
- **Dead Code:** ~403 lines
- **Potential Reduction:** 25-30% (~2,500-3,200 lines)

### Critical Issues

#### 1. 🔴 Dual Dashboard Systems (BROKEN)
Two completely different dashboard implementations exist:
- **Main page** (`/src/app/page.tsx`): 383-line client component (working)
- **Standalone pages** (`/clients`, `/users`, `/matrix`): RSC pages (currently broken)

**Impact:** Confusion, maintenance burden, one system is non-functional

#### 2. 🔴 Duplicate Table Implementations
Two complete table systems for the same data:
- Custom tables in `/home/components/` (manual sorting)
- TanStack tables in standalone pages (feature-rich)

**Impact:** ~500-700 lines of duplication

#### 3. 🟠 Business Logic Duplication
"isInternal" company detection logic duplicated in **17+ locations**:
```typescript
const internalKeywords = ['internal', 'moontide', 'everywhen', 'near&dear', 'bd'];
```

**Impact:** High risk of inconsistency, ~300 lines of duplication

#### 4. 🟠 Calculation Logic Duplication
Three different implementations of the same time log aggregations:
- Client-side: `/home/utils/calculations.ts`
- Deprecated API: `/api/analytics/route.ts`
- Active API: `/api/time-logs`

**Impact:** Maintenance burden, confusion about source of truth

#### 5. 🟡 Dead Code
- **Legacy server actions:** 134 lines of empty stub functions
- **Unused API route:** `/api/analytics` (269 lines)
- **Old migration scripts:** 3,214 lines

**Impact:** Confusion, false complexity

## Recommended Approach

### Phase 1: Quick Wins (2-3 hours)
**Remove dead code**
- Delete legacy server actions (`/src/actions/data.ts`)
- Delete unused API route (`/api/analytics`)
- **Impact:** -403 lines, immediate clarity

### Phase 2: Consolidate Logic (3-4 hours)
**Create single source of truth**
- New file: `/src/lib/business-rules.ts`
- Centralize "isInternal" logic
- Centralize rate calculations
- Replace 17+ duplicate implementations
- **Impact:** -300 lines, consistency guaranteed

### Phase 3: Choose Architecture (6-8 hours)
**Fix the broken system**
- **Option A:** Client-heavy (keep main page, delete standalone)
- **Option B:** Server-first (fix standalone pages, simplify main) ✅ **RECOMMENDED**

**Recommendation:** Server-first approach
- Aligns with Next.js 16 best practices
- Better performance (React Server Components)
- Simpler state management
- **Impact:** -1,000 lines, modern architecture

### Phase 4: Unify Tables (4-6 hours)
**Standardize on TanStack Table**
- Delete custom table implementations
- Use feature-rich TanStack Table throughout
- Create shared column definitions
- **Impact:** -500 lines, consistent UX

### Phase 5: Simplify Hooks (4-5 hours)
**Break down complex hooks**
- Extract reusable utilities (`useApiFetch`, `usePagination`)
- Simplify existing 200-300 line hooks
- **Impact:** Better testability, maintainability

### Phase 6: Archive Scripts (1 hour)
**Clean up old migrations**
- Move one-off scripts to archive
- **Impact:** -3,000 lines from active codebase

## Timeline
- **Sprint 1 (Week 1):** Phases 1-2 (Foundation)
- **Sprint 2 (Week 2):** Phase 3 (Architecture)
- **Sprint 3 (Week 3):** Phases 4-5 (Polish)
- **Sprint 4 (Ongoing):** Phase 6 + Testing

**Total:** 15-20 development days

## Expected Benefits

### Immediate
- ✅ 25-30% smaller codebase
- ✅ No broken pages
- ✅ Single source of truth for business logic
- ✅ Consistent table implementation

### Long-term
- ✅ Easier to onboard new developers
- ✅ Faster feature development
- ✅ Easier to test
- ✅ Better performance
- ✅ Aligned with Next.js best practices

## Risks & Mitigation

### High Risk: Phase 3 (Architecture Change)
**Mitigation:**
- Feature flag new architecture
- Comprehensive testing
- Rollback plan ready
- Staged rollout

### Medium Risk: Phase 2 (Business Logic)
**Mitigation:**
- Unit tests for business rules
- Export reference data before changes
- Side-by-side comparison

## Next Steps

1. **Review this plan** with team
2. **Make architecture decision** (Server-first vs Client-heavy)
3. **Set timeline** (compressed or 3-4 weeks?)
4. **Begin Phase 1** (quick wins)

## Full Plan
See detailed implementation plan: `/plans/codebase-simplification-plan.md`

---

**Status:** Draft - Pending Review
**Created:** 2026-02-11
**Estimated ROI:** High - Significant maintainability improvement for 3-4 weeks effort
