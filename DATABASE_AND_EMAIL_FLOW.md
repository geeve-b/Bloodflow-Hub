# Database Structure and Blood Request Email Notification Flow

## 1. Database Overview

**Database Name:** `bloodflow_hub`
**Type:** MongoDB Atlas
**Connection:** Via `SERVER_URL` environment variable

### Collections Structure

```
bloodflow_hub/
├── users/          ← All user accounts stored here
├── donors/         ← Donor-specific profiles
├── blood_requests/ ← Blood request postings
├── blood_inventory/← Hospital blood inventory
├── staff/          ← Hospital staff profiles
└── others...
```

---

## 2. Users Collection

### Where It's Stored
**Collection:** `users` in `bloodflow_hub` database
**Location in Code:** [server/db.ts](server/db.ts) - `db.collection("users")`

### User Schema
```typescript
{
  _id: ObjectId,
  username: string,
  email: string,              ← PRIMARY EMAIL FIELD
  password: string (hashed),
  emailVerified: boolean,
  emailVerificationCode: string | null,
  resetPasswordToken: string | null,
  role: "donor" | "hospital" | "admin" | "receiver",
  createdAt: Date,
  updatedAt: Date
}
```

### Key Points
- ✅ All users are stored in **ONE collection called `users`**
- ✅ Email field is the primary identifier for sending notifications
- ✅ User accounts are created regardless of role
- ✅ Donors are linked to users via the `userId` field in the `donors` collection

---

## 3. Donors Collection

### Where It's Stored
**Collection:** `donors` in `bloodflow_hub` database
**Location in Code:** [server/storage.ts](server/storage.ts) - `db.collection("donors")`

### Donor Schema
```typescript
{
  _id: ObjectId,
  userId: string,              ← LINKS TO users._id
  firstName: string,
  lastName: string,
  bloodType: string,           ← "O+", "O-", "A+", etc.
  phone: string,
  address: string,
  region: string,
  state: string,
  latitude: number,
  longitude: number,
  eligibilityStatus: "eligible" | "temporarily_ineligible" | "permanently_ineligible",
  deferralUntil: Date,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Key Points
- ✅ Donor data is stored separately from users
- ✅ Each donor record has a `userId` field that references a user in the `users` collection
- ✅ Eligibility and availability info is stored here
- ✅ Location data (region, state, address, latitude, longitude) is here

---

## 4. Blood Request Email Notification Flow

### Entry Point
**Location:** [server/routes.ts](server/routes.ts#L850-L900) - POST `/api/blood-requests` endpoint

### Step-by-Step Process

#### Step 1: Blood Request Created
```javascript
// User creates a blood request with blood type (e.g., "O+")
POST /api/blood-requests
{
  bloodType: "O+",
  region: "California",
  hospitalName: "St. Mary's Hospital",
  // ... other fields
}
```

#### Step 2: Find Compatible Donor Blood Types
```javascript
const compatibleTypes = getCompatibleDonorTypes(payload.bloodType);
// If request is for "O+", returns ["O-", "O+"]
// Because O- can donate to any type, O+ to some types
```

#### Step 3: Query Donors from Database
**Function:** `storage.getEligibleDonorsWithEmails(compatibleTypes, region)`
**Location:** [server/storage.ts](server/storage.ts#L605)

```javascript
// Step 3A: Query donors collection for matching blood types
const query = {
  bloodType: { $in: compatibleTypes }  // ["O-", "O+"]
};

const donors = await db
  .collection("donors")
  .find(query)
  .toArray();
// Returns all donors with matching blood types
```

#### Step 4: Filter Donors by Eligibility
```javascript
const filteredDonors = donors.filter((donorDoc) => {
  const donor = normalize<Donor>(donorDoc);
  
  // FILTER 1: Check eligibility status
  if (donor.eligibilityStatus !== "eligible") {
    return false;  // Exclude ineligible donors
  }
  
  // FILTER 2: Check if donor is active
  if (donor.isActive === false) {
    return false;  // Exclude inactive donors
  }
  
  // FILTER 3: Check region match (if region filter provided)
  if (region) {
    const regionRegex = new RegExp(region, "i");
    const hasMatchingLocation =
      (donor.region && regionRegex.test(donor.region)) ||
      (donor.state && regionRegex.test(donor.state)) ||
      (donor.address && regionRegex.test(donor.address));
    
    const hasNoLocation = !donor.region && !donor.state && !donor.address;
    
    if (!hasMatchingLocation && !hasNoLocation) {
      return false;  // Exclude donors not in region
    }
  }
  
  return true;  // Include this donor
});
```

#### Step 5: Join Donor with User Email
```javascript
for (const donorDoc of filteredDonors) {
  const donor = normalize<Donor>(donorDoc);
  
  // Step 5A: Convert userId to ObjectId
  let userId = toObjectId(donor.userId);
  
  // Step 5B: Query users collection using the userId
  const user = await db
    .collection("users")
    .findOne({ _id: userId });  ← JOINS donors to users collection
  
  if (!user) {
    console.log("No user found for this donor");
    continue;  // Skip if no user account exists
  }
  
  if (!user.email) {
    console.log("User has no email");
    continue;  // Skip if email is missing
  }
  
  // Step 5C: Collect eligible donor with email
  donorsWithEmails.push({
    donor,
    email: user.email,
    username: user.username
  });
}
```

#### Step 6: Send Email Notifications
**Function:** `sendBloodRequestNotification()`
**Location:** [server/email.ts](server/email.ts#L255)

```javascript
eligibleDonors.forEach(({ donor, email, username }) => {
  sendBloodRequestNotification({
    donorEmail: email,                    ← FROM users.email
    donorName: `${donor.firstName} ${donor.lastName}`,
    bloodType: payload.bloodType,
    urgency: payload.urgency,
    hospitalName: payload.hospitalName,
    // ... other details
  }).catch(error => {
    console.error(`Failed to send email to ${email}:`, error);
  });
});
```

### Email Template Sent
```
To: donor's email (from users.email)
Subject: 🚨 CRITICAL Blood Donation Request - O+

Hi [Donor Name],

There is an urgent blood donation request that matches your blood type.
Your help could save a life!

Blood Type: O+
Hospital: St. Mary's Hospital
Requester: Jane Smith
Region: California

[View Request & Respond Button]

— LifeFlow Team
```

---

## 5. Database Collections Used in Email Flow

| Collection | Purpose | Query Used | Retrieved Data |
|-----------|---------|-----------|-----------------|
| `donors` | Find eligible donors | `{ bloodType: { $in: [...] } }` | Donor profiles with all fields |
| `users` | Get donor email addresses | `{ _id: ObjectId }` | Email, username for sending |

---

## 6. Donor Filtering Criteria

### All Filtering Steps (in order)

| # | Filter | Field | Condition | Purpose |
|---|--------|-------|-----------|---------|
| 1 | Blood Type Match | `donors.bloodType` | Must match compatible types | Ensure blood compatibility |
| 2 | Eligibility Status | `donors.eligibilityStatus` | Must be `"eligible"` | Exclude deferred/ineligible donors |
| 3 | Active Status | `donors.isActive` | Must be `true` or undefined | Exclude inactive donors |
| 4 | Region Filter | `donors.region` / `donors.state` / `donors.address` | Must match request region OR no location set | Include local donors + unlocated donors |
| 5 | User Account | `users._id` match `donors.userId` | User must exist | Ensure email exists |
| 6 | Email Exists | `users.email` | Must not be null/empty | Can send email |

---

## 7. Code Flow Diagram

```
Blood Request Created
        ↓
Extract bloodType: "O+"
        ↓
Get Compatible Types: ["O-", "O+"]
        ↓
Query donors collection:
  find({ bloodType: { $in: ["O-", "O+"] } })
        ↓
Raw Donors Found: [10 donors]
        ↓
Filter by eligibility → [8 remaining]
        ↓
Filter by isActive → [7 remaining]
        ↓
Filter by region → [5 remaining]
        ↓
For each filtered donor:
  Get userId from donors.userId
  Query users.findOne({ _id: userId })
  Get email from user.email
        ↓
Eligible Donors with Emails: [5 donors]
        ↓
Send email via sendBloodRequestNotification()
        ↓
Email sent to all 5 eligible donors
```

---

## 8. Debug Points in Code

### Enable Logging for Troubleshooting

When debugging email sending, look for these console logs:

```
[DEBUG] Total users in system: X, emails: [...]
[DEBUG] Found Y donors for blood types O-, O+
[DEBUG] After filtering: Z donors eligible
[DEBUG] Processing donor: John Doe, userId: 507f1f77bcf86cd799439011
[DEBUG] Successfully found email john@example.com for donor John Doe
[DEBUG] Total eligible donors with valid emails: Z
```

### Key Debug Locations

1. **When donors are found:** [server/storage.ts](server/storage.ts#L623)
2. **When filtering:** [server/storage.ts](server/storage.ts#L628)
3. **When emails sent:** [server/email.ts](server/email.ts#L278)
4. **Async notification:** [server/routes.ts](server/routes.ts#L860)

---

## 9. Summary

✅ **All users stored in:** `bloodflow_hub.users` collection
✅ **All donors stored in:** `bloodflow_hub.donors` collection
✅ **Email field location:** `users.email`
✅ **Link between collections:** `donors.userId` → `users._id`
✅ **Filtering happens in:** Storage layer (`getEligibleDonorsWithEmails`)
✅ **Email sending:** `sendBloodRequestNotification()` function
