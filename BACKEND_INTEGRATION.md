# Backend Integration Notes

## ✅ Backend Status

The backend **already has full support** for the urgency field in blood requests. No additional backend changes are required.

---

## 📊 Database Schema (Already Implemented)

### Blood Requests Collection
```typescript
{
  _id: ObjectId,
  requesterId: string,
  requesterName: string,
  hospitalName: string,
  bloodType: enum["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
  quantity: number,
  urgency: enum["low", "medium", "high", "critical"],  // ← Already exists!
  reason: string (optional),
  status: enum["pending", "approved", "fulfilled", "rejected"],
  createdAt: Date,
  updatedAt: Date
}
```

### Validation (Zod Schema)
```typescript
// From shared/schema.ts
urgency: z.enum(["low", "medium", "high", "critical"]).default("medium")

// In insertBloodRequestSchema
urgency: true  // Included in request payload
```

---

## 🔌 API Endpoints

### All endpoints support urgency field:

#### POST /api/blood-requests
**Creates a new blood request with urgency**
```bash
curl -X POST http://localhost:3001/api/blood-requests \
  -H "Content-Type: application/json" \
  -d '{
    "requesterId": "user123",
    "requesterName": "John Doe",
    "hospitalName": "City General",
    "bloodType": "O-",
    "quantity": 2,
    "urgency": "critical",
    "reason": "Emergency surgery needed"
  }'
```

**Response:**
```json
{
  "_id": "req123",
  "requesterId": "user123",
  "requesterName": "John Doe",
  "hospitalName": "City General",
  "bloodType": "O-",
  "quantity": 2,
  "urgency": "critical",
  "reason": "Emergency surgery needed",
  "status": "pending",
  "createdAt": "2024-01-07T10:00:00Z",
  "updatedAt": "2024-01-07T10:00:00Z"
}
```

#### GET /api/blood-requests
**Retrieves all blood requests (with urgency)**
```bash
curl http://localhost:3001/api/blood-requests
```

**Response includes urgency for each request:**
```json
[
  {
    "_id": "req123",
    "patientName": "Alice Walker",
    "bloodType": "B-",
    "quantity": 2,
    "urgency": "critical",  // ← Returned in response
    "status": "pending",
    ...
  }
]
```

#### GET /api/blood-requests/:id
**Retrieves specific blood request**
```bash
curl http://localhost:3001/api/blood-requests/req123
```

**Returns request with urgency field**

#### PUT /api/blood-requests/:id
**Updates blood request (including urgency)**
```bash
curl -X PUT http://localhost:3001/api/blood-requests/req123 \
  -H "Content-Type: application/json" \
  -d '{
    "urgency": "high",
    "status": "approved"
  }'
```

#### POST /api/blood-requests/:id/notify-donors
**Sends notifications to eligible donors (includes urgency)**
```bash
curl -X POST http://localhost:3001/api/blood-requests/req123/notify-donors
```

**Uses urgency in email notification:**
- Email template receives urgency level
- Donors see urgency in notification
- Can prioritize responses based on urgency

---

## 📧 Email Notifications

### Notification Function (Already Updated)
```typescript
// server/email.ts
sendBloodRequestNotification({
  donorEmail: string,
  donorName: string,
  bloodType: string,
  urgency: "critical" | "high" | "medium" | "low",  // ← Included
  hospitalName: string,
  requesterName: string
})
```

### Email Template Usage
The urgency level is included in:
- Email subject (e.g., "🔴 CRITICAL: O- Blood Needed")
- Email body (highlighted with color)
- Call-to-action urgency ("Respond immediately if critical")

---

## 🔗 Frontend to Backend Flow

### Request Submission Flow
```
1. Frontend Form
   ├── Patient Name
   ├── Blood Group
   ├── Units
   ├── Hospital
   └── Phone

2. User Selects Urgency [Modal]
   ├── Critical
   ├── High
   ├── Medium
   └── Low

3. Frontend sends to Backend
   POST /api/blood-requests {
     requesterId,
     requesterName,
     hospitalName,
     bloodType,
     quantity,
     urgency: "selected_value",  ← From popup
     reason
   }

4. Backend Validation
   ├── Validates with Zod schema
   ├── Checks urgency enum
   ├── Returns 400 if invalid

5. Database Storage
   └── Saves with urgency field

6. Donor Notification
   ├── Finds eligible donors
   ├── Sends email with urgency
   └── Includes urgency in notification

7. Response to Frontend
   └── Returns request with urgency
```

---

## 🧪 Testing API Endpoints

### Test with Different Urgency Levels

#### Critical Request
```bash
curl -X POST http://localhost:3001/api/blood-requests \
  -H "Content-Type: application/json" \
  -d '{
    "requesterId": "test1",
    "requesterName": "Test User",
    "hospitalName": "Test Hospital",
    "bloodType": "O-",
    "quantity": 1,
    "urgency": "critical",
    "reason": "Emergency"
  }'
```

#### High Priority
```bash
curl -X POST http://localhost:3001/api/blood-requests \
  -H "Content-Type: application/json" \
  -d '{
    ...
    "urgency": "high",
    ...
  }'
```

#### Medium Priority
```bash
curl -X POST http://localhost:3001/api/blood-requests \
  -H "Content-Type: application/json" \
  -d '{
    ...
    "urgency": "medium",
    ...
  }'
```

#### Low Priority
```bash
curl -X POST http://localhost:3001/api/blood-requests \
  -H "Content-Type: application/json" \
  -d '{
    ...
    "urgency": "low",
    ...
  }'
```

---

## 🔍 Database Query Examples

### MongoDB Queries

#### Find all critical requests
```javascript
db.blood_requests.find({ urgency: "critical" })
```

#### Find pending critical requests
```javascript
db.blood_requests.find({ 
  urgency: "critical", 
  status: "pending" 
})
```

#### Count requests by urgency
```javascript
db.blood_requests.aggregate([
  { $group: { 
      _id: "$urgency", 
      count: { $sum: 1 } 
    } 
  }
])
```

#### Get latest critical requests (last 24 hours)
```javascript
db.blood_requests.find({
  urgency: "critical",
  createdAt: { 
    $gte: new Date(Date.now() - 24*60*60*1000) 
  }
}).sort({ createdAt: -1 })
```

---

## 📊 Data Validation

### Valid Urgency Values
```
✅ "critical"
✅ "high"
✅ "medium"
✅ "low"

❌ "CRITICAL" (case-sensitive)
❌ "urgent" (not in enum)
❌ "" (empty)
❌ null (required field)
❌ 123 (must be string)
```

### Default Behavior
```javascript
// If urgency not provided, defaults to:
urgency: "medium"

// Database ensures this with:
urgency: z.enum([...]).default("medium")
```

---

## 🚀 Deployment Notes

### No Database Migration Needed
- Field already exists in schema
- MongoDB is flexible (schema-less)
- Old requests will still work (no urgency = default "medium")

### Environment Variables
```
No new environment variables needed
Existing configuration sufficient
```

### API Version
```
No API version bump required
Backward compatible
Old clients still work
```

---

## 📝 Logging & Monitoring

### Backend Logs
```
[DEBUG] Creating blood request for blood type: O-
[INFO] Found 5 eligible donors for blood type O-
[ERROR] Failed to send email to donor@example.com
[INFO] Queued notifications for 5 eligible donors
```

### Monitor These Metrics
1. **Request Distribution by Urgency**
   ```
   Critical: 10%
   High: 20%
   Medium: 50%
   Low: 20%
   ```

2. **Response Times by Urgency**
   - Critical requests should be fulfilled fastest
   - Track average fulfillment time per urgency

3. **Notification Success Rate**
   - Track how many donors respond by urgency
   - Critical should have higher response rate

---

## 🔐 Security Considerations

### Input Validation
✅ Backend validates urgency enum
✅ Only allows ["low", "medium", "high", "critical"]
✅ Frontend validates before sending
✅ Prevents injection attacks

### Access Control
✅ Only logged-in users can create requests
✅ Users can only see their own requests (or hospital requests)
✅ Admin can view all requests with urgency
✅ Donors see urgency in notifications

---

## 🆚 Comparison: Before vs After

### Before Implementation
```
Request = {
  bloodType: "O-",
  quantity: 2,
  status: "pending"
}
// No way to prioritize
```

### After Implementation
```
Request = {
  bloodType: "O-",
  quantity: 2,
  urgency: "critical",  // ← Now we have priority!
  status: "pending"
}
// Hospitals prioritize, donors respond faster
```

---

## 📈 Future Enhancements

### Possible Extensions
1. **Urgency Escalation**
   ```javascript
   // Auto-escalate after time
   if (age > 24 hours && urgency === "medium") {
     urgency = "high"
   }
   ```

2. **Urgency-Based Sorting**
   ```javascript
   // Sort critical first
   requests.sort((a, b) => 
     urgencyScore[b.urgency] - urgencyScore[a.urgency]
   )
   ```

3. **Urgency Analytics**
   ```javascript
   // Track urgency trends
   db.blood_requests.aggregate([
     { $match: { createdAt: { $gte: oneMonthAgo } } },
     { $group: { 
         _id: "$urgency",
         count: { $sum: 1 },
         avgFulfillmentTime: { $avg: "$fulfillmentTime" }
       }
     }
   ])
   ```

4. **Smart Notifications**
   - Send SMS for critical requests
   - Call donors for critical blood types
   - Use different notification channels by urgency

5. **Urgency History**
   - Track urgency changes over time
   - See if requests escalate
   - Analyze urgency accuracy

---

## ✅ Verification Checklist

### Backend Ready?
- [x] Urgency field in schema
- [x] Validation in place
- [x] API endpoints support it
- [x] Database stores it
- [x] Email notifications include it
- [x] No breaking changes
- [x] Backward compatible

### Frontend Connected?
- [x] Form collects urgency
- [x] Popup shows options
- [x] Validation on client
- [x] Sends to correct endpoint
- [x] Displays in UI
- [x] Persists correctly

### Ready for Production?
- [x] All tests passing
- [x] No migration needed
- [x] Backward compatible
- [x] Secure implementation
- [x] Documentation complete

---

## 📞 Support

### Issue: Urgency not saving?
1. Check frontend sends urgency field
2. Verify enum value matches schema
3. Check MongoDB for stored value

### Issue: Not showing in API response?
1. Verify database has field
2. Check response serialization
3. Ensure API returns all fields

### Issue: Emails not including urgency?
1. Check sendBloodRequestNotification function
2. Verify email template includes urgency
3. Check logs for email errors

---

**Last Updated:** January 7, 2026
**Status:** Production Ready ✅
**No Additional Backend Work Required** ✨
