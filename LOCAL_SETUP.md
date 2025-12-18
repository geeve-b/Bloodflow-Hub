# Local Development Setup Guide

This guide will help you set up and run the BloodFlow-Hub project locally on your machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** (comes with Node.js)
- **PostgreSQL** (v16 recommended) - [Download here](https://www.postgresql.org/download/)

## Setup Steps

### 1. Install Dependencies

Open a terminal in the project root directory and install all dependencies:

```bash
npm install
```

or if you use yarn:

```bash
yarn install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/bloodflow_hub

# Node Environment
NODE_ENV=development

# Port Configuration
PORT=5000
CLIENT_PORT=5000

# Session Secret (generate a random string)
SESSION_SECRET=your_random_session_secret_here

# API URL
API_URL=http://localhost:5000
```

**Important:** Replace `username`, `password`, and other values with your actual configuration.

### 3. Set Up PostgreSQL Database

1. Start your PostgreSQL server
2. Create a new database:

```bash
createdb bloodflow_hub
```

or using psql:

```sql
CREATE DATABASE bloodflow_hub;
```

### 4. Push Database Schema

Run the Drizzle migrations to set up your database schema:

```bash
npm run db:push
```

## Running the Application

You have two options for running the application:

### Option 1: Development Mode (Client + Server Separately)

**Terminal 1 - Start the Server:**
```bash
npm run dev
```

**Terminal 2 - Start the Client (in a new terminal):**
```bash
npm run dev:client
```

The client will be available at `http://localhost:5000`

### Option 2: Production Build and Run

Build the project:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Available Scripts

- **`npm run dev:client`** - Start Vite dev server for the client (port 5000)
- **`npm run dev`** - Start the Express backend server
- **`npm run build`** - Build the project for production
- **`npm start`** - Start the production server
- **`npm run check`** - Type check with TypeScript
- **`npm run db:push`** - Sync database schema with Drizzle ORM

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check your `DATABASE_URL` in `.env.local`
- Verify the database exists

### Port Already in Use
- By default, the client runs on port 5000. If this port is in use, you can change it in `vite.config.ts`
- For the server, modify the `PORT` environment variable in `.env.local`

### Module Not Found Errors
- Delete `node_modules` folder
- Run `npm install` again

### TypeScript Errors
- Run `npm run check` to see detailed type errors
- Ensure you're using Node.js v18 or higher

## Project Structure

```
client/               # React frontend application
  src/
    components/      # React components
    pages/           # Page components
    context/         # React context
    hooks/           # Custom React hooks
    lib/             # Utility libraries
    
server/              # Express backend
  index.ts           # Main server file
  routes.ts          # API routes
  storage.ts         # Database layer
  
shared/              # Shared types and schemas
  schema.ts          # Zod schemas
```

## Building for Production

To create an optimized production build:

```bash
npm run build
```

This will create a `dist` folder with the compiled application ready for deployment.

## Next Steps

- Explore the codebase in the `client/src` and `server` directories
- Check the API routes in `server/routes.ts`
- Review the database schema in `shared/schema.ts`

For more information, refer to the main README or documentation files in the project.
