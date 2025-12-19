# Bloodflow-Hub API Documentation

## Base URL
```
http://localhost:5000/api
```

## Overview
This API provides endpoints for managing blood inventory, requests, users, and donors in the Bloodflow-Hub system.

---

## USER ENDPOINTS

### Get All Users
```
GET /api/users
```
**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "donor",
    "createdAt": "2025-12-19T10:00:00Z",
    "updatedAt": "2025-12-19T10:00:00Z"
  }
]
```

### Get User by ID
```
GET /api/users/:id
```
**Parameters:**
- `id` (string, required) - MongoDB ObjectId

### Create User (Register)
```
POST /api/users
```
**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securePassword123",
  "email": "john@example.com",
  "role": "donor"
}
```
**Response:** `201 Created`

### Update User
```
PUT /api/users/:id
```
**Request Body:** (All fields optional)
```json
{
  "password": "newPassword123",
  "email": "newemail@example.com"
}
```

### Delete User
```
DELETE /api/users/:id
```
**Response:** `200 OK`

---

## BLOOD INVENTORY ENDPOINTS

### Get All Blood Inventory
```
GET /api/blood-inventory
```

### Get Blood Inventory by ID
```
GET /api/blood-inventory/:id
```

### Get Inventory by Hospital
```
GET /api/blood-inventory/hospital/:hospitalId
```

### Get Inventory by Blood Type
```
GET /api/blood-inventory/type/:bloodType
```
**Blood Types:** O+, O-, A+, A-, B+, B-, AB+, AB-

### Create Blood Inventory
```
POST /api/blood-inventory
```
**Request Body:**
```json
{
  "hospitalId": "hospital123",
  "bloodType": "O+",
  "quantity": 50,
  "expiryDate": "2025-12-31T23:59:59Z",
  "status": "available"
}
```

### Update Blood Inventory
```
PUT /api/blood-inventory/:id
```
**Request Body:** (All fields optional)
```json
{
  "quantity": 45,
  "status": "reserved"
}
```

### Delete Blood Inventory
```
DELETE /api/blood-inventory/:id
```

---

## BLOOD REQUEST ENDPOINTS

### Get All Blood Requests
```
GET /api/blood-requests
```

### Get Blood Request by ID
```
GET /api/blood-requests/:id
```

### Get Requests by Status
```
GET /api/blood-requests/status/:status
```
**Status Values:** pending, approved, fulfilled, rejected

### Create Blood Request
```
POST /api/blood-requests
```
**Request Body:**
```json
{
  "requesterId": "user123",
  "requesterName": "Dr. Smith",
  "hospitalName": "City Hospital",
  "bloodType": "O+",
  "quantity": 5,
  "urgency": "high",
  "reason": "Emergency surgery needed"
}
```

### Update Blood Request
```
PUT /api/blood-requests/:id
```
**Request Body:** (All fields optional)
```json
{
  "status": "approved",
  "quantity": 4
}
```

### Delete Blood Request
```
DELETE /api/blood-requests/:id
```

---

## DONOR ENDPOINTS

### Get All Donors
```
GET /api/donors
```

### Get Donor by ID
```
GET /api/donors/:id
```

### Get Donors by Blood Type
```
GET /api/donors/bloodtype/:bloodType
```

### Create Donor
```
POST /api/donors
```
**Request Body:**
```json
{
  "userId": "user123",
  "firstName": "John",
  "lastName": "Doe",
  "bloodType": "O+",
  "phone": "555-1234",
  "address": "123 Main St, City"
}
```

### Update Donor
```
PUT /api/donors/:id
```
**Request Body:** (All fields optional)
```json
{
  "lastDonationDate": "2025-12-19T10:00:00Z",
  "isActive": false
}
```

### Delete Donor
```
DELETE /api/donors/:id
```

---

## HEALTH CHECK

### Check API Status
```
GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "message": "Bloodflow-Hub API is running"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input data"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Username already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Data Types

### Blood Types
- O+, O-, A+, A-, B+, B-, AB+, AB-

### User Roles
- donor
- hospital
- admin

### Blood Request Urgency
- low
- medium
- high
- critical

### Blood Request Status
- pending
- approved
- fulfilled
- rejected

### Blood Inventory Status
- available
- reserved
- expired

---

## Testing the API

### Using cURL
```bash
# Get all users
curl http://localhost:5000/api/users

# Create a new user
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "secure123",
    "email": "john@example.com",
    "role": "donor"
  }'

# Get blood inventory
curl http://localhost:5000/api/blood-inventory

# Create blood request
curl -X POST http://localhost:5000/api/blood-requests \
  -H "Content-Type: application/json" \
  -d '{
    "requesterId": "user123",
    "requesterName": "Dr. Smith",
    "hospitalName": "City Hospital",
    "bloodType": "O+",
    "quantity": 5,
    "urgency": "high"
  }'
```

### Using Postman
1. Import the endpoints from this documentation
2. Set the base URL to `http://localhost:5000/api`
3. Test each endpoint with the provided request bodies

---

## Notes
- All timestamps are in ISO 8601 format
- MongoDB ObjectIds are used for all document IDs
- Passwords are hashed using bcryptjs
- Validation is enforced using Zod schemas
