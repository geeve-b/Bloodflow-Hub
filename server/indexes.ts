/**
 * MongoDB Index Recommendations for Bloodflow Hub
 * 
 * To optimize query performance, create these indexes in MongoDB:
 * 
 * For Blood Requests:
 * - db.bloodRequests.createIndex({ bloodType: 1 })
 * - db.bloodRequests.createIndex({ urgency: 1 })
 * - db.bloodRequests.createIndex({ status: 1 })
 * - db.bloodRequests.createIndex({ hospitalName: 1 })
 * - db.bloodRequests.createIndex({ createdAt: -1 })
 * - db.bloodRequests.createIndex({ bloodType: 1, urgency: 1, status: 1 })
 * 
 * For Blood Inventory:
 * - db.bloodInventory.createIndex({ bloodType: 1 })
 * - db.bloodInventory.createIndex({ hospitalId: 1 })
 * - db.bloodInventory.createIndex({ status: 1 })
 * - db.bloodInventory.createIndex({ expiryDate: 1 })
 * - db.bloodInventory.createIndex({ status: 1, expiryDate: 1 })
 * - db.bloodInventory.createIndex({ bloodType: 1, status: 1 })
 * 
 * Text indexes for full-text search:
 * - db.bloodRequests.createIndex({ hospitalName: "text", requesterName: "text", bloodType: "text" })
 * - db.bloodInventory.createIndex({ bloodType: "text" })
 */

export async function createOptimalIndexes(db: any): Promise<void> {
  try {
    // Blood Requests indexes
    await db.collection("bloodRequests").createIndex({ bloodType: 1 });
    await db.collection("bloodRequests").createIndex({ urgency: 1 });
    await db.collection("bloodRequests").createIndex({ status: 1 });
    await db.collection("bloodRequests").createIndex({ hospitalName: 1 });
    await db.collection("bloodRequests").createIndex({ createdAt: -1 });
    await db.collection("bloodRequests").createIndex({ bloodType: 1, urgency: 1, status: 1 });

    // Blood Inventory indexes
    await db.collection("bloodInventory").createIndex({ bloodType: 1 });
    await db.collection("bloodInventory").createIndex({ hospitalId: 1 });
    await db.collection("bloodInventory").createIndex({ status: 1 });
    await db.collection("bloodInventory").createIndex({ expiryDate: 1 });
    await db.collection("bloodInventory").createIndex({ status: 1, expiryDate: 1 });
    await db.collection("bloodInventory").createIndex({ bloodType: 1, status: 1 });

    console.log("[INFO] Database indexes created successfully");
  } catch (error) {
    console.warn("[WARN] Some indexes may already exist or failed to create:", error);
  }
}
