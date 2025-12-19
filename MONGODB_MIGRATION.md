# Switch to MongoDB Atlas - Summary

## ✅ What Was Done

1. **Updated configuration files:**
   - `.env` - Updated to use MongoDB Atlas connection string
   - `drizzle.config.ts` - Configured for future use (kept for migrations)
   - `server/db.ts` - Changed to MongoDB driver
   - `server/index.ts` - Added MongoDB connection initialization

2. **Created guides:**
   - `MONGODB_SETUP.md` - Complete MongoDB Atlas setup instructions

3. **Packages ready:**
   - `mongodb` driver (to be installed)
   - `express` (already installed)

## 🚀 Quick Start

### Step 1: Create MongoDB Atlas Account
Go to: https://www.mongodb.com/cloud/atlas
- Sign up for free
- Create a project named "Bloodflow-Hub"
- Create a FREE M0 cluster

### Step 2: Get Connection String
1. Click **Connect** on your cluster
2. Select **Drivers** → **Node.js**
3. Copy the connection string

### Step 3: Update .env File
Replace the `DATABASE_URL` with your MongoDB connection string:

```env
DATABASE_URL=mongodb+srv://bloodflow_user:WIFIGHTERS@cluster0.xxxxx.mongodb.net/bloodflow_hub?retryWrites=true&w=majority
NODE_ENV=development
PORT=5000
```

### Step 4: Install MongoDB Driver
```bash
npm install mongodb
```

### Step 5: Start Your App
```bash
npm run dev
```

## 📝 Database Queries

Instead of Drizzle ORM, use MongoDB native queries:

```typescript
import { db } from "./db";

// Insert
await db.collection("users").insertOne({ username: "john", password: "hash" });

// Find
const users = await db.collection("users").find({}).toArray();

// Update
await db.collection("users").updateOne(
  { username: "john" },
  { $set: { email: "john@example.com" } }
);

// Delete
await db.collection("users").deleteOne({ username: "john" });
```

## ⚠️ Important Notes

- You need to update your `shared/schema.ts` to use MongoDB patterns if you want to continue using Drizzle
- Alternatively, use MongoDB native driver without Drizzle (simpler for MongoDB)
- All future database calls should use `db.collection("collectionName")`
- No more `npm run db:push` - MongoDB is schema-less

## 📚 Resources

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- MongoDB Docs: https://www.mongodb.com/docs/
- MongoDB Node Driver: https://www.mongodb.com/docs/drivers/node/

---

**Next: Create your MongoDB Atlas account and get your connection string!**
