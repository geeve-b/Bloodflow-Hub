# MongoDB Atlas Setup Guide for Bloodflow-Hub

## Step 1: Create MongoDB Atlas Account

1. Go to: https://www.mongodb.com/cloud/atlas
2. Click **Sign Up** (or Sign In if you have an account)
3. Create an account or login

## Step 2: Create a Cluster

1. After logging in, click **Create** to create a new project
2. Name your project: `Bloodflow-Hub`
3. Click **Create Project**
4. Click **Build a Database**
5. Choose the **FREE** tier (M0 Sandbox)
6. Select your preferred region (choose one closest to you)
7. Click **Create Deployment**
8. Wait 5-10 minutes for cluster to initialize

## Step 3: Add Database User

1. In the cluster page, go to **Database Access** (left sidebar)
2. Click **Add Database User**
3. Choose **Password** authentication
4. Enter username: `bloodflow_user`
5. Enter password: `WIFIGHTERS` (or any password you prefer)
6. Click **Add User**

## Step 4: Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (for development)
   - In production, add specific IPs instead
4. Click **Confirm**

## Step 5: Get Your Connection String

1. Go back to **Databases** (left sidebar)
2. Click the **Connect** button on your cluster
3. Click **Drivers**
4. Select **Node.js** from the driver list
5. Copy the connection string that looks like:
   ```
   mongodb+srv://bloodflow_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update Your .env File

Replace the `DATABASE_URL` in your `.env` file:

```env
DATABASE_URL=mongodb+srv://bloodflow_user:WIFIGHTERS@cluster0.xxxxx.mongodb.net/bloodflow_hub?retryWrites=true&w=majority
NODE_ENV=development
PORT=5000
```

**Important:** Replace:
- `cluster0.xxxxx` with your actual cluster ID from the connection string
- `WIFIGHTERS` with your actual password if you used a different one

## Step 7: Install MongoDB Package

MongoDB driver should already be installed. If not:

```bash
npm install mongodb
```

## Step 8: Start Your Application

```bash
npm run dev
```

Your app will now connect to MongoDB Atlas!

## Using MongoDB in Your Code

Example queries:

```typescript
import { db } from "./db";

// Insert a document
const result = await db.collection("users").insertOne({
  username: "john_doe",
  password: "hashed_password",
  createdAt: new Date(),
});

// Find documents
const users = await db.collection("users").find({}).toArray();

// Update a document
await db.collection("users").updateOne(
  { username: "john_doe" },
  { $set: { email: "john@example.com" } }
);

// Delete a document
await db.collection("users").deleteOne({ username: "john_doe" });
```

## Troubleshooting

### Connection Failed
- Verify IP address is whitelisted (Network Access)
- Check username and password in .env
- Make sure connection string includes `/bloodflow_hub` database name

### "Authentication failed"
- Double-check username/password
- Ensure user exists in Database Access section

### Slow Connection
- You might be on a free tier with limited performance
- Consider upgrading cluster if production-ready

## Next Steps

1. Update your `shared/schema.ts` to define MongoDB collections
2. Create API endpoints in `server/routes.ts` to interact with MongoDB
3. Build out your blood inventory, donor, and blood request collections

For more MongoDB info: https://www.mongodb.com/docs/
For Mongoose (optional ORM): https://mongoosejs.com/
