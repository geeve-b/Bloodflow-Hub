# Database Schema Extension Guide for Hospital Staff Dashboard

## Overview
This guide explains how to extend the BloodRequest schema to support all fields required by the Hospital Staff Dashboard.

## Current Schema vs. Extended Schema

### Current BloodRequest Schema
```typescript
// In shared/schema.ts
bloodRequestSchema = z.object({
  _id: z.instanceof(ObjectId),
  requesterId: z.string(),
  requesterName: z.string(),
  hospitalName: z.string(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  reason: z.string().optional(),
  status: z.enum(["pending", "approved", "fulfilled", "rejected"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

### Extended BloodRequest Schema (Recommended)
```typescript
// In shared/schema.ts
bloodRequestSchema = z.object({
  _id: z.instanceof(ObjectId),
  requesterId: z.string(),
  requesterName: z.string(),
  patientName: z.string().optional(),           // NEW: Specific patient name
  hospitalName: z.string(),
  hospitalAddress: z.string().optional(),       // NEW: Hospital location
  contactNumber: z.string().optional(),         // NEW: Hospital contact
  coordinatorName: z.string().optional(),       // NEW: Coordinator name
  coordinatorContact: z.string().optional(),    // NEW: Coordinator contact
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  reason: z.string().optional(),
  purpose: z.enum(["Surgery", "Emergency", "Delivery", "Treatment", "Accident"]).optional(), // NEW
  operationType: z.string().optional(),         // NEW: Specific operation type
  requiredWithin: z.string().optional(),        // NEW: Time requirement
  remarks: z.string().optional(),               // NEW: Additional notes
  status: z.enum(["pending", "approved", "fulfilled", "rejected"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

## MongoDB Schema Migration

### Step 1: Update TypeScript Schema
Edit `shared/schema.ts`:

```typescript
import { z } from "zod";
import { ObjectId } from "mongodb";

export const bloodRequestSchema = z.object({
  _id: z.instanceof(ObjectId),
  requesterId: z.string(),
  requesterName: z.string(),
  patientName: z.string().optional(),
  hospitalName: z.string(),
  hospitalAddress: z.string().optional(),
  contactNumber: z.string().optional(),
  coordinatorName: z.string().optional(),
  coordinatorContact: z.string().optional(),
  bloodType: z.enum(["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"]),
  quantity: z.number(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  reason: z.string().optional(),
  purpose: z.enum(["Surgery", "Emergency", "Delivery", "Treatment", "Accident"]).optional(),
  operationType: z.string().optional(),
  requiredWithin: z.string().optional(),
  remarks: z.string().optional(),
  status: z.enum(["pending", "approved", "fulfilled", "rejected"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BloodRequest = z.infer<typeof bloodRequestSchema>;
```

### Step 2: MongoDB Migration Script

Create `scripts/migrate-blood-requests.ts`:

```typescript
import { MongoClient, Db } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = "bloodflow";
const COLLECTION_NAME = "bloodrequests";

interface BloodRequestDocument {
  _id?: any;
  requesterId: string;
  requesterName: string;
  hospitalName: string;
  bloodType: string;
  quantity: number;
  urgency: string;
  reason?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  // New fields to be added
  patientName?: string;
  hospitalAddress?: string;
  contactNumber?: string;
  coordinatorName?: string;
  coordinatorContact?: string;
  purpose?: string;
  operationType?: string;
  requiredWithin?: string;
  remarks?: string;
}

async function migrateBloodRequests() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db: Db = client.db(DB_NAME);
    const collection = db.collection<BloodRequestDocument>(COLLECTION_NAME);

    console.log("Starting migration of BloodRequest documents...");

    // Add new fields with default values to all existing documents
    const result = await collection.updateMany(
      {},
      {
        $set: {
          patientName: { $ifNull: ["$patientName", "$requesterName"] },
          hospitalAddress: { $ifNull: ["$hospitalAddress", ""] },
          contactNumber: { $ifNull: ["$contactNumber", ""] },
          coordinatorName: { $ifNull: ["$coordinatorName", ""] },
          coordinatorContact: { $ifNull: ["$coordinatorContact", ""] },
          purpose: { $ifNull: ["$purpose", "Treatment"] },
          operationType: { $ifNull: ["$operationType", ""] },
          requiredWithin: { $ifNull: ["$requiredWithin", "ASAP"] },
          remarks: { $ifNull: ["$remarks", ""] },
        },
      }
    );

    console.log(`Migration completed successfully!`);
    console.log(`Matched documents: ${result.matchedCount}`);
    console.log(`Modified documents: ${result.modifiedCount}`);

    // Create indexes for better query performance
    await collection.createIndex({ urgency: 1, status: 1 });
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ hospitalName: 1 });
    console.log("Indexes created successfully!");

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run migration
migrateBloodRequests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

### Step 3: Update API Routes

Update `server/routes.ts` to include new fields:

```typescript
// In the POST /api/blood-requests endpoint
router.post("/blood-requests", async (req, res) => {
  try {
    const {
      requesterId,
      requesterName,
      patientName,
      hospitalName,
      hospitalAddress,
      contactNumber,
      coordinatorName,
      coordinatorContact,
      bloodType,
      quantity,
      urgency,
      reason,
      purpose,
      operationType,
      requiredWithin,
      remarks,
      status = "pending",
    } = req.body;

    // Validate required fields
    if (!requesterId || !requesterName || !hospitalName || !bloodType || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const bloodRequest = {
      requesterId,
      requesterName,
      patientName: patientName || requesterName,
      hospitalName,
      hospitalAddress: hospitalAddress || "",
      contactNumber: contactNumber || "",
      coordinatorName: coordinatorName || "",
      coordinatorContact: coordinatorContact || "",
      bloodType,
      quantity: Number(quantity),
      urgency,
      reason: reason || "",
      purpose: purpose || "Treatment",
      operationType: operationType || "",
      requiredWithin: requiredWithin || "ASAP",
      remarks: remarks || "",
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("bloodrequests").insertOne(bloodRequest);

    res.status(201).json({
      id: result.insertedId,
      ...bloodRequest,
    });
  } catch (error) {
    console.error("Error creating blood request:", error);
    res.status(500).json({ error: "Failed to create blood request" });
  }
});

// Update the PUT endpoint to support all fields
router.put("/blood-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    const result = await db.collection("bloodrequests").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return res.status(404).json({ error: "Blood request not found" });
    }

    res.json(result.value);
  } catch (error) {
    console.error("Error updating blood request:", error);
    res.status(500).json({ error: "Failed to update blood request" });
  }
});
```

## Running the Migration

### Option 1: Using npm script

Add to `package.json`:
```json
{
  "scripts": {
    "migrate:blood-requests": "ts-node scripts/migrate-blood-requests.ts"
  }
}
```

Run:
```bash
npm run migrate:blood-requests
```

### Option 2: Using ts-node directly

```bash
npx ts-node scripts/migrate-blood-requests.ts
```

### Option 3: Manual MongoDB Operations

Connect to MongoDB and run:

```javascript
// Add new fields to all documents
db.bloodrequests.updateMany(
  {},
  [
    {
      $set: {
        patientName: { $ifNull: ["$patientName", "$requesterName"] },
        hospitalAddress: { $ifNull: ["$hospitalAddress", ""] },
        contactNumber: { $ifNull: ["$contactNumber", ""] },
        coordinatorName: { $ifNull: ["$coordinatorName", ""] },
        coordinatorContact: { $ifNull: ["$coordinatorContact", ""] },
        purpose: { $ifNull: ["$purpose", "Treatment"] },
        operationType: { $ifNull: ["$operationType", ""] },
        requiredWithin: { $ifNull: ["$requiredWithin", "ASAP"] },
        remarks: { $ifNull: ["$remarks", ""] },
      },
    },
  ]
);

// Create indexes
db.bloodrequests.createIndex({ urgency: 1, status: 1 });
db.bloodrequests.createIndex({ createdAt: -1 });
db.bloodrequests.createIndex({ hospitalName: 1 });
```

## Verification

After migration, verify the changes:

```javascript
// Check one document
db.bloodrequests.findOne();

// Check count
db.bloodrequests.countDocuments();

// Check if all documents have new fields
db.bloodrequests.aggregate([
  {
    $match: {
      patientName: { $exists: true },
      hospitalAddress: { $exists: true },
    },
  },
  { $count: "count" },
]);
```

## Rollback Plan

If you need to rollback:

```javascript
// Remove new fields
db.bloodrequests.updateMany(
  {},
  {
    $unset: {
      patientName: 1,
      hospitalAddress: 1,
      contactNumber: 1,
      coordinatorName: 1,
      coordinatorContact: 1,
      purpose: 1,
      operationType: 1,
      requiredWithin: 1,
      remarks: 1,
    },
  }
);
```

## Dashboard Integration

### Update HospitalStaffDashboard.tsx

The dashboard component automatically uses the new fields:

```typescript
// These fields are now populated and displayed
{selectedRequest.patientName || selectedRequest.requesterName}
{selectedRequest.purpose || selectedRequest.reason}
{selectedRequest.operationType || "Not specified"}
{selectedRequest.requiredWithin || "As soon as possible"}
{selectedRequest.hospitalAddress || "Not provided"}
{selectedRequest.contactNumber || "Not provided"}
{selectedRequest.remarks}
```

## Best Practices

1. **Backup First**: Always backup your database before migration
2. **Test First**: Run migration on a development database first
3. **Monitor**: Monitor the migration process and check logs
4. **Verify**: Verify all documents were updated correctly
5. **Document**: Keep records of migration dates and changes
6. **Gradual Rollout**: Deploy to production during low-traffic periods

## Performance Considerations

- Migration uses bulk updates for efficiency
- Indexes are created to improve query performance
- Consider doing migration during maintenance window
- For large collections (>100k documents), consider batching

## Troubleshooting

**Issue**: Migration fails with "Connection refused"
- **Solution**: Ensure MongoDB is running and URI is correct

**Issue**: Some documents missing new fields
- **Solution**: Run the update query again to catch any missed documents

**Issue**: Slow performance after migration
- **Solution**: Ensure indexes are created properly

## Support

For issues or questions, check:
1. MongoDB logs for errors
2. Application logs for API errors
3. Database indexes with `db.bloodrequests.getIndexes()`
4. Document structure with `db.bloodrequests.findOne()`

---

**Last Updated**: 2024
**Version**: 1.0.0
