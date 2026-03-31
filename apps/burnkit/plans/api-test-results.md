# Teamwork API Test Results

## Test Execution Summary

**Date**: 2026-01-27  
**Status**: ✅ All Tests Passed  
**Site**: moontideagency2.teamwork.com  
**Company**: Near&Dear

## Authentication

**Method**: HTTP Basic Authentication  
**Format**: `Authorization: Basic base64(api_key:X)`  
**Result**: ✅ Successfully authenticated

## API Endpoints Tested

### 1. Account Information

**Endpoint**: `GET /account.json`  
**Status**: ✅ Success  
**Response**:

- Company: Near&Dear
- Code: moontideagency2
- URL: https://projects.nearanddear.agency/

### 2. Companies (Clients)

**Endpoint**: `GET /companies.json`  
**Status**: ✅ Success  
**Results**: 10+ companies found

**Sample Companies**:

- Near&Dear (ID: 1399573)
- AAA Club Alliance (ACA) (ID: 1402322)
- Addyi (ID: 1424890)
- Bennev - Letybo (ID: 1426083)
- CooperSurgical (ID: 1403035)

**Note**: `isOwner` field is undefined in response, need to check alternative field for internal company detection.

### 3. Projects

**Endpoint**: `GET /projects.json`  
**Status**: ✅ Success  
**Results**: 10+ active projects found

**Sample Projects**:

- 1776 | OT Media (ID: 1238224, Company: OrangeTwist)
- 2035 NewCo (ID: 1320820, Company: Moontide - Business Development)
- 2062 | N&D Brand Launch (ID: 1346027, Company: Near&Dear)
- 2114 | NEO Splash Page (ID: 1334368, Company: Neocis)
- 2144 | NEO Website Redesign (ID: 1344952, Company: Neocis)

### 4. People (Users)

**Endpoint**: `GET /people.json`  
**Status**: ✅ Success  
**Results**: 10+ people found

**Note**: `firstName` and `lastName` fields are undefined in the response. Need to investigate correct field names.

### 5. Time Entries

**Endpoint**: `GET /time_entries.json`  
**Status**: ✅ Success  
**Date Range**: Last 30 days (2025-12-28 to 2026-01-27)  
**Results**: 10+ time entries found

**Sample Time Entries**:

#### Entry 1

- Date: 2025-12-29T15:00:00Z
- Hours: 1.00
- Billable: No
- Description: 30s Video edits
- Company: Emergent - Visit Florida
- Project: Visit Florida Retainer - Families & ONT

#### Entry 2

- Date: 2025-12-29T17:00:00Z
- Hours: 1.00
- Billable: No
- Description: Jerry and Bobby video edit plan, direction, and file prep and handoff

#### Entry 3

- Date: 2025-12-29T21:00:00Z
- Hours: 0.50
- Billable: No
- Description: [INT] Emergent + Visit Florida Retainer Weekly Status

## Data Structure Analysis

### Time Entry Fields

The Teamwork API returns time entries with the following structure:

```javascript
{
  // Identification
  "id": "18987021",

  // Date/Time
  "date": "2025-12-29T15:00:00Z",
  "dateUserPerspective": "2025-12-29T10:00:00Z",
  "createdAt": "2026-01-05T21:09:57Z",
  "updated-date": "2026-01-05T21:09:57Z",
  "has-start-time": "1",

  // Hours
  "hours": "1",
  "minutes": "0",
  "hoursDecimal": "1",

  // Billing
  "isbillable": "1",  // Note: lowercase 'isbillable'
  "isbilled": "0",
  "invoiceNo": "",
  "invoiceStatus": "",

  // Description
  "description": "30s Video edits",

  // Person
  "person-id": "719965",
  "person-first-name": "Jerry",
  "person-last-name": "Yoo",
  "avatarUrl": "https://s3.amazonaws.com/TWFiles/...",
  "userDeleted": false,

  // Company
  "company-id": "1423984",
  "company-name": "Emergent - Visit Florida",

  // Project
  "project-id": "1339845",
  "project-name": "Visit Florida Retainer - Families & ONT",
  "project-status": "active",

  // Task
  "todo-item-id": "47249892",
  "todo-item-name": "Discovery/Creative Concepting",
  "todo-list-id": "3797118",
  "todo-list-name": "VF Families Campaign",
  "tasklistId": "3797118",
  "parentTaskId": "0",
  "parentTaskName": "",
  "taskIsPrivate": "0",
  "taskIsSubTask": "0",
  "taskEstimatedTime": "0",

  // Tags
  "tags": {},
  "task-tags": {},

  // Permissions
  "canEdit": true,

  // Ticket
  "ticket-id": ""
}
```

## Key Findings

### 1. Field Naming Conventions

- **Hyphenated fields**: Many fields use hyphens (e.g., `person-first-name`, `company-id`)
- **Lowercase flags**: Boolean flags are lowercase (e.g., `isbillable`, `isbilled`)
- **String values**: Most values are strings, including numbers (e.g., `"hours": "1"`)

### 2. Person Data

- Person information is embedded in time entries
- Fields: `person-id`, `person-first-name`, `person-last-name`
- Need to fetch from `/people.json` endpoint for full details

### 3. Company Data

- Company information is embedded in time entries
- Fields: `company-id`, `company-name`
- Need to determine internal vs external companies

### 4. Project Data

- Project information is embedded in time entries
- Fields: `project-id`, `project-name`, `project-status`
- Projects are linked to companies

### 5. Billing Status

- `isbillable`: "1" or "0" (string)
- `isbilled`: "1" or "0" (string)
- Need to map to BurnKit categories: billable, gap, internal

## Data Mapping Strategy

### Person Mapping

```typescript
Teamwork → BurnKit
{
  "person-id": "719965",
  "person-first-name": "Jerry",
  "person-last-name": "Yoo"
}
→
{
  name: "Jerry Yoo",
  teamworkId: "719965"
}
```

### Client Mapping

```typescript
Teamwork → BurnKit
{
  "company-id": "1423984",
  "company-name": "Emergent - Visit Florida"
}
→
{
  name: "Emergent - Visit Florida",
  teamworkId: "1423984",
  isInternal: false  // Determine by company name pattern or flag
}
```

### Job Mapping

```typescript
Teamwork → BurnKit
{
  "project-id": "1339845",
  "project-name": "Visit Florida Retainer - Families & ONT",
  "company-id": "1423984"
}
→
{
  jobNumber: "TW-1339845",
  description: "Visit Florida Retainer - Families & ONT",
  clientId: <mapped-client-id>
}
```

### Time Entry Mapping

```typescript
Teamwork → BurnKit
{
  "id": "18987021",
  "date": "2025-12-29T15:00:00Z",
  "hours": "1",
  "minutes": "0",
  "isbillable": "1",
  "description": "30s Video edits",
  "person-id": "719965",
  "company-id": "1423984",
  "project-id": "1339845"
}
→
{
  teamworkId: "18987021",
  itemDate: new Date("2025-12-29"),
  hours: 1.0,
  dollars: <calculated from rate>,
  category: "billable",  // Based on isbillable flag
  itemDesc: "30s Video edits",
  personId: <mapped-person-id>,
  clientId: <mapped-client-id>,
  jobId: <mapped-job-id>,
  sourceType: "teamwork"
}
```

### Category Determination

```typescript
function determineCategory(entry: TeamworkTimeEntry): TimeEntryCategory {
  // Check if project/company is internal
  if (isInternalCompany(entry["company-name"])) {
    return "internal";
  }

  // Check billable flag
  if (entry.isbillable === "1") {
    return "billable";
  }

  // Non-billable on external project
  return "gap";
}

function isInternalCompany(companyName: string): boolean {
  const internalKeywords = ["internal", "moontide", "near&dear", "everywhen"];
  return internalKeywords.some((keyword) =>
    companyName.toLowerCase().includes(keyword)
  );
}
```

## Recommendations

### 1. API Client Implementation

- Use Basic Authentication with API key
- Handle hyphenated field names
- Convert string numbers to actual numbers
- Implement pagination for large datasets

### 2. Data Validation

- Validate required fields exist
- Handle missing person/company data
- Check for deleted users (`userDeleted` flag)
- Validate date formats

### 3. Error Handling

- Handle 401 Unauthorized (invalid API key)
- Handle 429 Rate Limit (implement backoff)
- Handle 404 Not Found (invalid endpoints)
- Handle network errors

### 4. Performance Optimization

- Batch API requests
- Cache company/project/person data
- Use pagination efficiently
- Implement incremental sync

### 5. Data Integrity

- Create entity mappings before time entries
- Use transactions for consistency
- Validate foreign key relationships
- Handle duplicate entries

## Next Steps

1. ✅ API connection validated
2. ✅ Data structure analyzed
3. ⏭️ Implement Teamwork API client library
4. ⏭️ Create data mapper functions
5. ⏭️ Build sync service
6. ⏭️ Add configuration UI
7. ⏭️ Test with production data

## Test Script

The test script is available at [`scripts/test-teamwork-api.ts`](../scripts/test-teamwork-api.ts)

To run:

```bash
npx tsx scripts/test-teamwork-api.ts
```

---

**Status**: Ready for Implementation  
**Confidence Level**: High  
**Blockers**: None
