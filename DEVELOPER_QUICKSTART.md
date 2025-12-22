# 🚀 Developer Quick Start Guide

## 5-Minute Setup

### 1. Start the Server
```bash
npm run dev
```

**Expected output:**
```
Connected to MongoDB Atlas
serving on port 5000
```

### 2. Access the App
- Frontend: http://localhost:5000
- API: http://localhost:5000/api

### 3. Test an Endpoint
```bash
curl http://localhost:5000/api/health
```

---

## Common Tasks

### Create a User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "donor1",
    "password": "Pass123!",
    "email": "donor@example.com",
    "role": "donor"
  }'
```

### Add Blood to Inventory
```bash
curl -X POST http://localhost:5000/api/blood-inventory \
  -H "Content-Type: application/json" \
  -d '{
    "hospitalId": "hospital1",
    "bloodType": "O+",
    "quantity": 50,
    "expiryDate": "2025-12-31T23:59:59Z",
    "status": "available"
  }'
```

### Request Blood
```bash
curl -X POST http://localhost:5000/api/blood-requests \
  -H "Content-Type: application/json" \
  -d '{
    "requesterId": "user1",
    "requesterName": "Dr. Smith",
    "hospitalName": "City Hospital",
    "bloodType": "O+",
    "quantity": 5,
    "urgency": "high"
  }'
```

### Register a Donor
```bash
curl -X POST http://localhost:5000/api/donors \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "firstName": "John",
    "lastName": "Doe",
    "bloodType": "O+",
    "phone": "555-1234",
    "address": "123 Main St"
  }'
```

---

## All Endpoints at a Glance

```
USERS
  GET    /api/users
  GET    /api/users/:id
  POST   /api/users
  PUT    /api/users/:id
  DELETE /api/users/:id

BLOOD INVENTORY
  GET    /api/blood-inventory
  GET    /api/blood-inventory/:id
  GET    /api/blood-inventory/hospital/:hospitalId
  GET    /api/blood-inventory/type/:bloodType
  POST   /api/blood-inventory
  PUT    /api/blood-inventory/:id
  DELETE /api/blood-inventory/:id

BLOOD REQUESTS
  GET    /api/blood-requests
  GET    /api/blood-requests/:id
  GET    /api/blood-requests/status/:status
  POST   /api/blood-requests
  PUT    /api/blood-requests/:id
  DELETE /api/blood-requests/:id

DONORS
  GET    /api/donors
  GET    /api/donors/:id
  GET    /api/donors/bloodtype/:bloodType
  POST   /api/donors
  PUT    /api/donors/:id
  DELETE /api/donors/:id

HEALTH
  GET    /api/health
```

---

## Environment Setup

File: `.env`
```
DATABASE_URL=mongodb+srv://bloodflow_user:WIFIGHTERS@cluster0.4cqysnk.mongodb.net/bloodflow_hub?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=development
PORT=5000
```

---

## File Structure

```
server/
├── index.ts         ← Main server
├── routes.ts        ← All API endpoints
├── storage.ts       ← Database operations
└── db.ts            ← MongoDB connection

shared/
└── schema.ts        ← Data validation

Key Files
├── .env             ← Configuration
├── package.json     ← Dependencies
└── drizzle.config.ts ← DB config
```

---

## Useful npm Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run check      # Check TypeScript
npm install        # Install dependencies
```

---

## Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 409 | Conflict (e.g., user exists) |
| 500 | Server Error |

---

## Blood Types

O+, O-, A+, A-, B+, B-, AB+, AB-

---

## Request Urgency Levels

low, medium, high, critical

---

## Request Status Values

pending, approved, fulfilled, rejected

---

## User Roles

donor, hospital, admin

---

## Data Format

All timestamps: ISO 8601 format
```
2025-12-19T10:00:00Z
```

---

## Passwords

✅ Automatically hashed with bcryptjs  
✅ Never stored in plain text  
✅ Use strong passwords (6+ chars)

---

## Testing

### Windows
```bash
./test-api.bat
```

### Linux/Mac
```bash
./test-api.sh
```

---

## Debugging

### Check MongoDB Connection
```bash
npm run dev
# Look for: "Connected to MongoDB Atlas"
```

### View API Response
```bash
curl -X GET http://localhost:5000/api/users | json_pp
```

### Check Port Usage
Windows:
```bash
netstat -ano | findstr :5000
```

---

## Integration with Frontend

The React frontend can call the API:

```javascript
// Example: Get all blood requests
fetch('http://localhost:5000/api/blood-requests')
  .then(res => res.json())
  .then(data => console.log(data))
```

```javascript
// Example: Create a blood request
fetch('http://localhost:5000/api/blood-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requesterId: 'user123',
    requesterName: 'Dr. Smith',
    hospitalName: 'City Hospital',
    bloodType: 'O+',
    quantity: 5,
    urgency: 'high'
  })
})
```

---

## MongoDB Atlas Dashboard

Visit: https://account.mongodb.com/account/login

Collections visible:
- users
- bloodInventory
- bloodRequests
- donors

---

## Need More Info?

📖 **Full API Documentation**: `API_DOCUMENTATION.md`  
📋 **Quick Reference**: `QUICK_REFERENCE.md`  
🎓 **Setup Guide**: `BACKEND_SETUP_COMPLETE.md`

---

## Ready to Code?

1. Start server: `npm run dev`
2. Open browser: `http://localhost:5000`
3. Make API calls
4. Build amazing features!

**Let's go! 🚀**
