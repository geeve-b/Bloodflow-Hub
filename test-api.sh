#!/bin/bash
# Test script for Bloodflow-Hub API

BASE_URL="http://localhost:5000/api"

echo "Testing Bloodflow-Hub API"
echo "=========================="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -X GET "$BASE_URL/health" \
  -H "Content-Type: application/json" \
  -w "\n\n"

# Test 2: Create User
echo "2. Creating a new user..."
curl -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@123",
    "email": "test@example.com",
    "role": "donor"
  }' \
  -w "\n\n"

# Test 3: Get All Users
echo "3. Getting all users..."
curl -X GET "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -w "\n\n"

# Test 4: Create Blood Inventory
echo "4. Creating blood inventory..."
curl -X POST "$BASE_URL/blood-inventory" \
  -H "Content-Type: application/json" \
  -d '{
    "hospitalId": "hospital001",
    "bloodType": "O+",
    "quantity": 50,
    "expiryDate": "2025-12-31T23:59:59Z",
    "status": "available"
  }' \
  -w "\n\n"

# Test 5: Get Blood Inventory
echo "5. Getting all blood inventory..."
curl -X GET "$BASE_URL/blood-inventory" \
  -H "Content-Type: application/json" \
  -w "\n\n"

# Test 6: Create Blood Request
echo "6. Creating a blood request..."
curl -X POST "$BASE_URL/blood-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "requesterId": "user001",
    "requesterName": "Dr. John Smith",
    "hospitalName": "City Medical Hospital",
    "bloodType": "O+",
    "quantity": 5,
    "urgency": "high",
    "reason": "Emergency surgery"
  }' \
  -w "\n\n"

# Test 7: Get Blood Requests
echo "7. Getting all blood requests..."
curl -X GET "$BASE_URL/blood-requests" \
  -H "Content-Type: application/json" \
  -w "\n\n"

# Test 8: Create Donor
echo "8. Creating a donor..."
curl -X POST "$BASE_URL/donors" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user001",
    "firstName": "John",
    "lastName": "Doe",
    "bloodType": "O+",
    "phone": "+1-555-1234",
    "address": "123 Main Street, City"
  }' \
  -w "\n\n"

# Test 9: Get Donors
echo "9. Getting all donors..."
curl -X GET "$BASE_URL/donors" \
  -H "Content-Type: application/json" \
  -w "\n\n"

echo ""
echo "=========================="
echo "API Tests Complete!"
