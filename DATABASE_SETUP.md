# PostgreSQL Database Setup Guide for Bloodflow-Hub

## Prerequisites
- PostgreSQL installed on your system
- Node.js and npm installed

## Installation Steps

### 1. Install PostgreSQL (Windows)

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Set a password for the `postgres` user (remember this!)
4. Use default settings (Port: 5432)
5. PostgreSQL will be installed as a Windows service

### 2. Create Your Database

Open **pgAdmin** (comes with PostgreSQL) or use **psql** command line:

#### Option A: Using pgAdmin (GUI)
1. Open pgAdmin from Start Menu
2. Right-click "Databases" → Create → Database
3. Name it: `bloodflow_hub`
4. Click Save

#### Option B: Using psql (Command Line)
```bash
psql -U postgres
CREATE DATABASE bloodflow_hub;
\q
```

### 3. Configure Environment Variables

The `.env` file has been created in your project root. Update it with your database credentials:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/bloodflow_hub
NODE_ENV=development
PORT=3000
```

**Replace:**
- `username` - Usually `postgres` (default PostgreSQL user)
- `password` - The password you set during PostgreSQL installation
- `bloodflow_hub` - Your database name

### 4. Test Your Connection

Run this command to verify the connection:

```bash
npm run db:push
```

This will:
- Push your schema from `shared/schema.ts` to the database
- Create all necessary tables
- Set up migrations

## Using the Database in Your Code

The database is already configured in `server/db.ts` and initialized in `server/index.ts`.

### Example: Query Users

```typescript
import { db } from "./db";
import { users } from "../shared/schema";

// Insert a user
await db.insert(users).values({
  username: "john_doe",
  password: "hashed_password"
});

// Fetch all users
const allUsers = await db.select().from(users);

// Fetch a specific user
const user = await db.select().from(users).where(eq(users.username, "john_doe"));
```

## Scripts

- `npm run dev` - Start development server with database connection
- `npm run db:push` - Push schema changes to database
- `npm run build` - Build for production
- `npm start` - Start production server

## Troubleshooting

### Connection Refused
- Check PostgreSQL service is running: `Services` → PostgreSQL
- Verify DATABASE_URL is correct
- Ensure port 5432 is not blocked

### "DATABASE_URL not set"
- Make sure `.env` file exists in project root
- Verify environment variable is loaded: `dotenv/config` is imported

### Permission Denied
- Check username and password in DATABASE_URL
- Verify user has database creation permissions

## Database Structure

Your schema includes:
- **users table** - Stores user accounts with username and password
  - `id` - UUID primary key
  - `username` - Unique username
  - `password` - Password hash

## Next Steps

1. Update `shared/schema.ts` to add more tables (blood inventory, donors, requests, etc.)
2. Run `npm run db:push` after schema changes
3. Create API endpoints in `server/routes.ts` to interact with your database

For more info on Drizzle ORM: https://orm.drizzle.team/
