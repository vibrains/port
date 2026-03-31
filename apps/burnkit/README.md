# BurnKit

A comprehensive financial analytics dashboard for agencies to track time entries, analyze billable hours, and gain insights into project profitability.

## Overview

BurnKit is a Next.js-based financial analytics platform designed to help agencies manage and analyze their time tracking data. It provides powerful visualization and reporting capabilities for understanding team utilization, client profitability, and project performance.

### Key Features

- **📊 Dashboard Overview** - Real-time analytics with summary cards showing total hours, billable percentages, and revenue metrics
- **👥 People Management** - Track individual contributor performance, billable rates, and utilization across projects
- **🏢 Client Analytics** - Analyze client profitability, billable vs non-billable hours, and revenue by client
- **🔄 Matrix View** - Person-client relationship matrix showing detailed breakdowns of time allocation
- **📈 Insights** - Advanced analytics and trend visualization for data-driven decision making
- **📤 Data Import** - Excel file upload with automatic parsing and data validation
- **🔐 Authentication** - Secure login system with NextAuth.js
- **🎨 Modern UI** - Built with shadcn/ui components and Tailwind CSS for a polished user experience

## Tech Stack

### Core Framework
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

### Database & ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Primary database
- **[Prisma](https://www.prisma.io/)** - Type-safe ORM with PostgreSQL adapter
- **[pg](https://node-postgres.com/)** - PostgreSQL client for Node.js

### Authentication
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication for Next.js
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Password hashing

### UI Components
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible components
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[Recharts](https://recharts.org/)** - Charting library

### Data Processing
- **[xlsx](https://sheetjs.com/)** - Excel file parsing
- **[react-dropzone](https://react-dropzone.js.org/)** - File upload interface
- **[date-fns](https://date-fns.org/)** - Date manipulation

### Form & Validation
- **[React Hook Form](https://react-hook-form.com/)** - Form state management
- **[Zod](https://zod.dev/)** - Schema validation
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Form validation resolvers

### Additional Libraries
- **[TanStack Table](https://tanstack.com/table)** - Headless table library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme management
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** 14.x or higher
- A PostgreSQL database (local or hosted)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd burnkit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/burnkit"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # Optional: Environment-based users for development (format: email:bcrypt_hash)
   AUTH_USERS="admin@example.com:$2a$10$..."
   ```

   **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

   **Generate password hash for AUTH_USERS:**
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
   ```

4. **Set up the database**
   
   Generate Prisma client:
   ```bash
   npx prisma generate
   ```
   
   Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
   
   (Optional) Seed the database:
   ```bash
   npx prisma db seed
   ```

5. **Create your first user**
   
   You can either:
   - Add a user via the `AUTH_USERS` environment variable (for development)
   - Manually insert a user into the database:
     ```sql
     INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
     VALUES (
       'user_id',
       'admin@example.com',
       'Admin User',
       '$2a$10$...', -- bcrypt hash of your password
       NOW(),
       NOW()
     );
     ```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Database Schema

The application uses a star schema design optimized for analytics:

### Dimension Tables
- **`users`** - Application users with authentication
- **`dim_persons`** - People/employees who log time
- **`dim_clients`** - Clients (internal and external)
- **`dim_jobs`** - Jobs/projects associated with clients

### Fact Table
- **`fact_time_entries`** - Time entry records with hours, dollars, and categorization
  - Categories: `billable`, `gap` (non-billable on billable jobs), `internal`

### Audit Table
- **`import_batches`** - Tracks data imports with metadata

## Project Structure

```
burnkit/
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   └── migrations/            # Database migrations
├── public/                    # Static assets
├── src/
│   ├── actions/              # Server actions
│   │   ├── data.ts          # Data fetching logic
│   │   └── import.ts        # Excel import logic
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Authentication routes
│   │   │   └── login/      # Login page
│   │   ├── (dashboard)/    # Protected dashboard routes
│   │   │   ├── page.tsx    # Overview dashboard
│   │   │   ├── clients/    # Client analytics
│   │   │   ├── people/     # People analytics
│   │   │   ├── matrix/     # Person-client matrix
│   │   │   ├── insights/   # Advanced insights
│   │   │   └── upload/     # Data import
│   │   ├── api/
│   │   │   └── auth/       # NextAuth API routes
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── dashboard/      # Dashboard-specific components
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── filter-bar.tsx
│   │   │   ├── header.tsx
│   │   │   └── hours-chart.tsx
│   │   ├── ui/            # shadcn/ui components
│   │   └── providers.tsx  # Context providers
│   ├── lib/
│   │   ├── auth.ts        # NextAuth configuration
│   │   ├── db.ts          # Prisma client setup
│   │   ├── excel-parser.ts # Excel parsing logic
│   │   └── utils.ts       # Utility functions
│   ├── types/
│   │   └── next-auth.d.ts # NextAuth type extensions
│   ├── generated/         # Generated Prisma client
│   └── middleware.ts      # Auth middleware
├── .env                   # Environment variables (create this)
├── components.json        # shadcn/ui configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Key Functionalities

### 1. Authentication
- Credential-based authentication using NextAuth.js
- Password hashing with bcryptjs
- JWT session strategy
- Protected routes via middleware
- Fallback to environment-based users for development

### 2. Data Import
- Excel file upload via drag-and-drop interface
- Automatic parsing of "DATA" sheet
- Validation and categorization of time entries
- Batch processing for large datasets
- Import history tracking
- Automatic dimension table updates (persons, clients, jobs)

### 3. Dashboard Analytics
- **Overview**: Summary cards with KPIs, hours distribution chart, top clients and contributors
- **Clients**: Sortable table with billable percentages, revenue, and utilization metrics
- **People**: Individual performance tracking with department filtering
- **Matrix**: Person-client relationship breakdown
- **Insights**: Advanced analytics and trend visualization

### 4. Filtering System
- Date range filtering
- Department filtering
- Client type filtering (internal/external)
- Client exclusion
- Real-time filter application with URL state management

### 5. Data Categorization
Time entries are automatically categorized as:
- **Billable**: Revenue-generating client work
- **Gap**: Non-billable hours on billable projects
- **Internal**: Internal operations and overhead

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Application URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | Secret key for NextAuth.js session encryption |
| `AUTH_USERS` | No | Comma-separated list of email:hash pairs for dev auth |
| `NODE_ENV` | No | Environment mode (`development`, `production`) |

## Excel File Format

The application expects Excel files with a sheet named "DATA" containing the following columns:

- **Client Description** - Client name
- **Account Executive** - Person name
- **Item Date** - Date of time entry
- **Total To Date Hours** / **Total Hours** - Hours worked
- **Billed Amount** - Billable amount
- **Non Billable Amount** - Non-billable amount
- **Is Non Billable** - Flag (0 or 1)
- **Non Billable** - Flag (0 or 1)
- **Job** - Job number
- **Component** - Component description
- **Item Description** - Item description
- **Estimate Amount** - Estimated amount

## Development

### Database Management

**View database in Prisma Studio:**
```bash
npx prisma studio
```

**Create a new migration:**
```bash
npx prisma migrate dev --name migration_name
```

**Reset database:**
```bash
npx prisma migrate reset
```

**Generate Prisma Client after schema changes:**
```bash
npx prisma generate
```

### Adding UI Components

This project uses shadcn/ui. To add new components:

```bash
npx shadcn@latest add [component-name]
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Ensure your hosting platform supports:
- Node.js 20+
- PostgreSQL database
- Environment variables
- Server-side rendering (SSR)

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database user permissions

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Ensure user exists in database or `AUTH_USERS`

### Import Failures
- Verify Excel file has a "DATA" sheet
- Check column names match expected format
- Review console logs for parsing errors

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the repository or contact the development team.

---

Built with ❤️ using Next.js and modern web technologies.
