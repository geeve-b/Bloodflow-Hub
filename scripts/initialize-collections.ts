import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("❌ DATABASE_URL or MONGO_URI environment variable is not set");
  process.exit(1);
}

async function initializeCollections() {
  const client = new MongoClient(MONGODB_URI as string);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB");

    const db = client.db("staff");
    console.log(`✓ Using database: staff`);

    // Create collections
    const collections = ["users", "donors", "receivers", "staff", "bloodInventory", "bloodRequests"];
    
    for (const collectionName of collections) {
      try {
        const collection = await db.createCollection(collectionName);
        console.log(`✓ Created collection: ${collectionName}`);
      } catch (err: any) {
        if (err.code === 48) {
          console.log(`⚠ Collection already exists: ${collectionName}`);
        } else {
          throw err;
        }
      }
    }

    // Create indexes
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    console.log("✓ Created index on users.username");

    await db.collection("donors").createIndex({ userId: 1 });
    console.log("✓ Created index on donors.userId");

    await db.collection("donors").createIndex({ bloodType: 1 });
    console.log("✓ Created index on donors.bloodType");

    await db.collection("receivers").createIndex({ userId: 1 });
    console.log("✓ Created index on receivers.userId");

    await db.collection("receivers").createIndex({ bloodType: 1 });
    console.log("✓ Created index on receivers.bloodType");

    await db.collection("staff").createIndex({ userId: 1 });
    console.log("✓ Created index on staff.userId");

    await db.collection("bloodInventory").createIndex({ hospitalId: 1 });
    console.log("✓ Created index on bloodInventory.hospitalId");

    await db.collection("bloodInventory").createIndex({ bloodType: 1 });
    console.log("✓ Created index on bloodInventory.bloodType");

    // Insert sample data
    const sampleDonor = {
      userId: "sample-donor-user",
      firstName: "John",
      lastName: "Donor",
      bloodType: "O+",
      phone: "+1-555-0101",
      address: "123 Main St, City",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sampleReceiver = {
      userId: "sample-receiver-user",
      firstName: "Jane",
      lastName: "Patient",
      bloodType: "AB-",
      phone: "+1-555-0102",
      address: "456 Oak Ave, City",
      hospitalName: "Central Hospital",
      medicalCondition: "Emergency Surgery",
      urgencyLevel: "high",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const sampleInventory = {
      hospitalId: "hospital-001",
      bloodType: "O+",
      quantity: 50,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "available",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if sample data exists before inserting
    const donorExists = await db.collection("donors").findOne({ userId: "sample-donor-user" });
    if (!donorExists) {
      await db.collection("donors").insertOne(sampleDonor);
      console.log("✓ Inserted sample donor");
    } else {
      console.log("⚠ Sample donor already exists");
    }

    const receiverExists = await db.collection("receivers").findOne({ userId: "sample-receiver-user" });
    if (!receiverExists) {
      await db.collection("receivers").insertOne(sampleReceiver);
      console.log("✓ Inserted sample receiver");
    } else {
      console.log("⚠ Sample receiver already exists");
    }

    const inventoryExists = await db.collection("bloodInventory").findOne({ hospitalId: "hospital-001" });
    if (!inventoryExists) {
      await db.collection("bloodInventory").insertOne(sampleInventory);
      console.log("✓ Inserted sample blood inventory");
    } else {
      console.log("⚠ Sample blood inventory already exists");
    }

    // Show collection stats
    console.log("\n📊 Collection Status:");
    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`  ${collectionName}: ${count} document(s)`);
    }

    console.log("\n✅ Database initialization complete!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

initializeCollections();
