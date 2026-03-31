# Refactoring Plan for src/app/page.tsx

## Current State Analysis

The file `src/app/page.tsx` has grown to approximately **2,930 lines** and contains:

1. **Type Definitions** (Lines 59-150): Multiple interfaces for data structures
2. **State Management** (Lines 152-227): 15+ useState hooks for various states
3. **Data Fetching Logic** (Lines 229-650): Multiple fetch functions with complex retry/abort logic
4. **Data Processing** (Lines 650-1200): Complex useMemo hooks for filtering, sorting, aggregating data
5. **Tab Content** (Lines 1200-2925): 5 different tab views (Insights, Clients, People, Matrix, Time Logs)
6. **Helper Functions**: Formatting, sorting, pagination utilities scattered throughout

## Proposed Architecture

### Directory Structure

```
src/app/
├── page.tsx                          # Main page - orchestrates components
├── (dashboard)/
│   └── home/                         # New directory for home page components
│       ├── types.ts                  # All TypeScript interfaces
│       ├── hooks/
│       │   ├── useDashboardData.ts   # Data fetching hook
│       │   ├── useTimeLogs.ts        # Time logs fetching with retry/abort
│       │   └── useFilters.ts         # Filter state management
│       ├── components/
│       │   ├── DashboardFilters.tsx  # Company, User, Project, Date filters
│       │   ├── QuickFilters.tsx      # All/External/Internal buttons
│       │   ├── InsightsCards.tsx     # Top row of insight cards
│       │   ├── TopPerformersCard.tsx # Top performers ranking
│       │   ├── RiskAnalysisCard.tsx  # Non-billable risk card
│       │   ├── DepartmentBreakdown.tsx
│       │   ├── ClientsTable.tsx      # Clients tab content
│       │   ├── PeopleTable.tsx       # People tab content
│       │   ├── MatrixTable.tsx       # Matrix tab content
│       │   └── TimeLogsTable.tsx     # Time Logs tab content
│       └── utils/
│           ├── formatters.ts         # Number, currency formatting
│           ├── sorting.ts            # Sort logic
│           └── calculations.ts       # Data aggregation helpers
```

### Component Breakdown

#### 1. Types (`types.ts`)

Move all interfaces:

- `ClientData`
- `PersonData`
- `MatrixData`
- `TimeLog`
- `AnalyticsData`
- `Company`
- `User`
- `Project`

#### 2. Hooks

**`useDashboardData.ts`**

- Fetches companies, users, projects
- Manages loading states
- Returns data and setters

**`useTimeLogs.ts`**

- Handles time logs fetching with AbortController
- Retry logic with exponential backoff
- Request deduplication
- Returns timeLogs, loading state, refetch function

**`useFilters.ts`**

- Manages all filter state (companies, users, projects, dates)
- Provides filter change handlers
- Computes filtered data

#### 3. Components

**`DashboardFilters.tsx`**

- Company multi-select
- User multi-select
- Project multi-select (conditional)
- Date range pickers

**`InsightsCards.tsx`**

- Total External Hours card
- Total Billable Hours card
- Billable Rate card
- Revenue at Risk card
- Internal Hours card

**`TopPerformersCard.tsx`**

- External-only billable hours ranking
- Top 5 performers list

**`RiskAnalysisCard.tsx`**

- Clients with >20% non-billable
- Risk percentage display

**`ClientsTable.tsx`**

- Clients tab table with sorting
- Filtered by selected companies/projects

**`PeopleTable.tsx`**

- People tab table with sorting
- Shows user rates
- Filtered by selected users

**`MatrixTable.tsx`**

- Matrix tab table
- Person x Client cross-reference

**`TimeLogsTable.tsx`**

- Time logs tab with pagination
- Condensed/expanded view toggle
- Search functionality

### Data Flow

```
page.tsx
├── useDashboardData() - Fetches companies, users, projects
├── useTimeLogs() - Fetches time logs based on filters
├── useFilters() - Manages filter state
│
├── DashboardFilters (companies, users, projects, dates)
├── QuickFilters (All/External/Internal)
│
├── Tabs
    ├── Insights Tab
    │   ├── InsightsCards (5 cards)
    │   ├── TopPerformersCard
    │   ├── RiskAnalysisCard
    │   └── DepartmentBreakdown
    │
    ├── Clients Tab → ClientsTable
    ├── People Tab → PeopleTable
    ├── Matrix Tab → MatrixTable
    └── Time Logs Tab → TimeLogsTable
```

### Migration Strategy

1. **Phase 1: Extract Types and Utilities**

   - Move interfaces to `types.ts`
   - Move formatters to `utils/formatters.ts`
   - Move sorting logic to `utils/sorting.ts`

2. **Phase 2: Create Hooks**

   - Extract `useDashboardData`
   - Extract `useTimeLogs`
   - Extract `useFilters`

3. **Phase 3: Create Components**

   - Create filter components
   - Create insights card components
   - Create table components (one per tab)

4. **Phase 4: Refactor Main Page**
   - Update `page.tsx` to use new components
   - Remove old inline code
   - Test thoroughly

### Benefits

1. **Maintainability**: Each component is focused and testable
2. **Reusability**: Components can be reused across pages
3. **Performance**: Better control over re-renders with proper memoization
4. **Developer Experience**: Smaller files are easier to navigate and understand
5. **Scalability**: Easy to add new features without bloating the main file

### Estimated File Sizes After Refactor

- `page.tsx`: ~200-300 lines (orchestration only)
- `types.ts`: ~100 lines
- Each hook: ~100-200 lines
- Each component: ~100-300 lines
- Utilities: ~50-100 lines each

Total: Better organized, more maintainable codebase
