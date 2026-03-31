# Teamwork API Endpoints Reference

This document provides a comprehensive reference for the Teamwork API endpoints available for the BurnKit integration.

## Base URL

```
https://{site-name}.teamwork.com
```

For Near&Dear: `https://moontideagency2.teamwork.com`

## Authentication

Teamwork uses **Basic Authentication** with:

- **Username**: Your API key
- **Password**: `X` (literal letter X)

```typescript
const authString = Buffer.from(`${API_KEY}:X`).toString("base64");
const headers = {
  Authorization: `Basic ${authString}`,
  "Content-Type": "application/json",
};
```

## Core Endpoints

### 1. Account Information

**Endpoint:** `GET /account.json`

**Purpose:** Get account details and configuration

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `companyname` | string | Account/company name |
| `companyid` | string | Company ID |
| `code` | string | Site code |
| `URL` | string | Custom domain URL |
| `time-tracking-enabled` | boolean | Whether time tracking is enabled |
| `pricePlanName` | string | Subscription plan name |
| `paidForUsers` | string | Number of paid seats |

---

### 2. Companies (Clients)

**Endpoint:** `GET /companies.json`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `pageSize` | number | Results per page (max 500) |
| `updatedAfterDate` | string | Filter by update date (YYYY-MM-DD) |

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Company ID |
| `name` | string | Company name |
| `address` | string | Address |
| `city` | string | City |
| `country` | string | Country |
| `website` | string | Website URL |
| `phone` | string | Phone number |
| `email` | string | Email address |
| `owner-id` | string | Owner user ID |
| `created-at` | string | Creation timestamp |
| `updated-at` | string | Last update timestamp |

---

### 3. Projects

**Endpoint:** `GET /projects.json`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `pageSize` | number | Results per page (max 500) |
| `status` | string | Filter by status: `active`, `archived`, `current` |
| `companyId` | number | Filter by company ID |
| `updatedAfterDate` | string | Filter by update date |
| `includePeople` | boolean | Include project members |
| `includeProjectOwner` | boolean | Include project owner details |

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Project ID |
| `name` | string | Project name |
| `description` | string | Project description |
| `status` | string | `active`, `archived`, `current` |
| `subStatus` | string | `current`, `late`, `upcoming` |
| `company.id` | string | Associated company ID |
| `company.name` | string | Associated company name |
| `startDate` | string | Project start date |
| `endDate` | string | Project end date |
| `created-on` | string | Creation timestamp |
| `last-changed-on` | string | Last update timestamp |
| `category.id` | string | Project category ID |
| `category.name` | string | Project category name |
| `tags` | array | Project tags |

---

### 4. People (Users)

**Endpoint:** `GET /people.json`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `pageSize` | number | Results per page (max 500) |
| `projectId` | number | Filter by project membership |
| `companyId` | number | Filter by company |

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | User ID |
| `first-name` | string | First name |
| `last-name` | string | Last name |
| `full-name` | string | Full name |
| `email-address` | string | Email address |
| `user-name` | string | Login username |
| `user-type` | string | `account`, `collaborator`, `client` |
| `company-id` | string | Primary company ID |
| `company-name` | string | Primary company name |
| `title` | string | Job title |
| `phone-number-office` | string | Office phone |
| `phone-number-mobile` | string | Mobile phone |
| `avatar-url` | string | Avatar image URL |
| `created-at` | string | Account creation date |
| `last-login` | string | Last login timestamp |
| `last-active` | string | Last activity timestamp |
| `administrator` | boolean | Is admin user |
| `in-owner-company` | boolean | Is in owner company |
| `permissions` | object | User permissions object |

#### Field Selection for People

You can use the `fields[people]` or `fields[person]` parameter to request specific fields:

**Available Fields:**

- `id`, `firstName`, `lastName`, `title`, `email`
- `companyId`, `company`
- `isAdmin`, `isClientUser`, `isServiceAccount`, `type`, `deleted`
- `avatarUrl`, `lengthOfDay`, `workingHoursId`, `workingHour`
- `userRate` - Hourly billing rate
- `userCost` - Internal cost rate
- `canAddProjects`

**Example:**

```
GET /people.json?fields[people]=id,firstName,lastName,email,userRate,userCost
```

**Note:** The `userRate` and `userCost` fields are only returned if:

1. The user has permission to view financial data
2. Rates have been configured for the user in Teamwork

---

### 5. Time Entries

**Endpoint:** `GET /time_entries.json`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `pageSize` | number | Results per page (max 500) |
| `fromDate` | string | Start date (YYYY-MM-DD) |
| `toDate` | string | End date (YYYY-MM-DD) |
| `userId` | number | Filter by user ID |
| `projectId` | number | Filter by project ID |
| `companyId` | number | Filter by company ID |
| `billable` | boolean | Filter by billable status |
| `includeArchivedProjects` | boolean | Include archived projects |

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Time entry ID |
| `date` | string | Entry date (ISO 8601) |
| `dateUserPerspective` | string | Date from user's timezone |
| `hours` | string | Hours logged |
| `minutes` | string | Minutes logged |
| `hoursDecimal` | string | Hours as decimal (e.g., "1.5") |
| `description` | string | Entry description |
| `isbillable` | string | `"1"` = billable, `"0"` = non-billable |
| `isbilled` | string | `"1"` = already billed, `"0"` = not billed |
| `invoiceNo` | string | Associated invoice number |
| `invoiceStatus` | string | Invoice status |
| `person-id` | string | User ID who logged time |
| `person-first-name` | string | User's first name |
| `person-last-name` | string | User's last name |
| `company-id` | string | Company ID |
| `company-name` | string | Company name |
| `project-id` | string | Project ID |
| `project-name` | string | Project name |
| `project-status` | string | Project status |
| `todo-item-id` | string | Task ID |
| `todo-item-name` | string | Task name |
| `todo-list-id` | string | Task list ID |
| `todo-list-name` | string | Task list name |
| `parentTaskId` | string | Parent task ID (for subtasks) |
| `parentTaskName` | string | Parent task name |
| `taskIsPrivate` | string | `"1"` = private task |
| `taskIsSubTask` | string | `"1"` = is subtask |
| `taskEstimatedTime` | string | Estimated time for task |
| `tags` | object | Entry tags |
| `task-tags` | object | Task tags |
| `has-start-time` | string | `"1"` = has specific start time |
| `createdAt` | string | Entry creation timestamp |
| `updated-date` | string | Last update timestamp |
| `userDeleted` | boolean | Whether user is deleted |

---

### 6. Tasks

**Endpoint:** `GET /projects/{projectId}/tasks.json`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `pageSize` | number | Results per page |
| `filter` | string | Filter criteria |
| `status` | string | Filter by status |

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Task ID |
| `content` | string | Task name/content |
| `description` | string | Task description |
| `status` | string | `new`, `in progress`, `complete`, etc. |
| `project-id` | number | Project ID |
| `project-name` | string | Project name |
| `todo-list-id` | number | Task list ID |
| `todo-list-name` | string | Task list name |
| `company-id` | number | Company ID |
| `company-name` | string | Company name |
| `creator-id` | number | Creator user ID |
| `creator-firstname` | string | Creator first name |
| `creator-lastname` | string | Creator last name |
| `assigned-to` | object | Assignee information |
| `completed` | boolean | Is completed |
| `start-date` | string | Start date |
| `due-date` | string | Due date |
| `created-on` | string | Creation timestamp |
| `last-changed-on` | string | Last update timestamp |
| `estimated-minutes` | number | Estimated time in minutes |
| `priority` | string | Priority level |
| `progress` | number | Completion percentage |
| `parentTaskId` | string | Parent task ID |
| `has-dependencies` | number | Has task dependencies |
| `timeIsLogged` | string | `"1"` = time has been logged |
| `tags` | array | Task tags |

---

### 7. Task Lists

**Endpoint:** `GET /projects/{projectId}/tasklists.json`

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Task list ID |
| `name` | string | Task list name |
| `description` | string | Description |
| `projectId` | string | Project ID |
| `projectName` | string | Project name |
| `position` | number | Sort position |
| `status` | string | `new`, `reopened`, `complete` |
| `complete` | boolean | Is complete |
| `private` | boolean | Is private |
| `uncompleted-count` | number | Number of uncompleted tasks |
| `milestone-id` | string | Associated milestone ID |
| `createdAt` | string | Creation timestamp |
| `lastUpdated` | string | Last update timestamp |
| `isBillable` | boolean/null | Billable status |

---

### 8. Tags

**Endpoint:** `GET /tags.json`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `pageSize` | number | Results per page |

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Tag ID |
| `name` | string | Tag name |
| `color` | string | Hex color code |
| `projectId` | string | Associated project (0 = global) |
| `dateCreated` | string | Creation timestamp |
| `dateUpdated` | string | Last update timestamp |

---

### 9. Latest Activity

**Endpoint:** `GET /latestActivity.json`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `maxRecords` | number | Maximum records to return |

**Key Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Activity ID |
| `activitytype` | string | Type of activity |
| `type` | string | Item type (task, comment, etc.) |
| `description` | string | Activity description |
| `extradescription` | string | Additional details |
| `project-id` | string | Project ID |
| `project-name` | string | Project name |
| `company-id` | string | Company ID |
| `company-name` | string | Company name |
| `itemid` | string | Related item ID |
| `itemlink` | string | Link to item |
| `userid` | string | User who performed action |
| `fromusername` | string | Username |
| `datetime` | string | Activity timestamp |

---

## Data Mapping for BurnKit

### Time Entry → BurnKit Schema

| Teamwork Field                           | BurnKit Field | Notes             |
| ---------------------------------------- | ------------- | ----------------- |
| `id`                                     | `externalId`  | Store Teamwork ID |
| `date`                                   | `date`        | Entry date        |
| `hoursDecimal`                           | `hours`       | Total hours       |
| `description`                            | `description` | Entry description |
| `isbillable`                             | `isBillable`  | `"1"` → `true`    |
| `person-id`                              | `personId`    | Link to Person    |
| `person-first-name` + `person-last-name` | `personName`  | Full name         |
| `company-id`                             | `clientId`    | Link to Client    |
| `company-name`                           | `clientName`  | Client name       |
| `project-id`                             | `jobId`       | Link to Job       |
| `project-name`                           | `jobName`     | Job name          |
| `todo-item-id`                           | `taskId`      | Link to Task      |
| `todo-item-name`                         | `taskName`    | Task name         |

### Person Mapping

| Teamwork Field  | BurnKit Field |
| --------------- | ------------- |
| `id`            | `externalId`  |
| `first-name`    | `firstName`   |
| `last-name`     | `lastName`    |
| `email-address` | `email`       |
| `user-type`     | `type`        |
| `company-name`  | `department`  |

### Client Mapping

| Teamwork Field | BurnKit Field |
| -------------- | ------------- |
| `id`           | `externalId`  |
| `name`         | `name`        |
| `website`      | `website`     |
| `phone`        | `phone`       |
| `email`        | `email`       |

### Job Mapping

| Teamwork Field | BurnKit Field |
| -------------- | ------------- |
| `id`           | `externalId`  |
| `name`         | `name`        |
| `company-id`   | `clientId`    |
| `status`       | `status`      |
| `startDate`    | `startDate`   |
| `endDate`      | `endDate`     |

---

## Rate Limits

Teamwork API typically allows:

- **200 requests per minute** for most endpoints
- **500 items per page** maximum for list endpoints

Use pagination (`page` and `pageSize` parameters) for large datasets.

---

## Error Handling

Common HTTP status codes:

| Code  | Meaning                              |
| ----- | ------------------------------------ |
| `200` | Success                              |
| `401` | Unauthorized - Check API key         |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not found                            |
| `429` | Rate limit exceeded                  |
| `500` | Server error                         |

---

## Additional Resources

- [Teamwork API Documentation](https://developer.teamwork.com/)
- [API Reference](https://apidocs.teamwork.com/)
