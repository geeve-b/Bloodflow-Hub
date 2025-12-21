@echo off
REM Test script for Bloodflow-Hub API

setlocal enabledelayedexpansion

set BASE_URL=http://localhost:5000/api

echo Testing Bloodflow-Hub API
echo ==========================
echo.

REM Test 1: Health Check
echo 1. Testing Health Check...
powershell -Command "Invoke-RestMethod -Uri '%BASE_URL%/health' -Method Get | ConvertTo-Json"
echo.
echo.

REM Test 2: Create User
echo 2. Creating a new user...
powershell -Command "Invoke-RestMethod -Uri '%BASE_URL%/users' -Method Post -ContentType 'application/json' -Body '{\"username\":\"testuser\",\"password\":\"Test@123\",\"email\":\"test@example.com\",\"role\":\"donor\"}' | ConvertTo-Json"
echo.
echo.

REM Test 3: Get All Users
echo 3. Getting all users...
powershell -Command "Invoke-RestMethod -Uri '%BASE_URL%/users' -Method Get | ConvertTo-Json"
echo.
echo.

REM Test 4: Create Blood Inventory
echo 4. Creating blood inventory...
powershell -Command "Invoke-RestMethod -Uri '%BASE_URL%/blood-inventory' -Method Post -ContentType 'application/json' -Body '{\"hospitalId\":\"hospital001\",\"bloodType\":\"O+\",\"quantity\":50,\"expiryDate\":\"2025-12-31T23:59:59Z\",\"status\":\"available\"}' | ConvertTo-Json"
echo.
echo.

REM Test 5: Get Blood Inventory
echo 5. Getting all blood inventory...
powershell -Command "Invoke-RestMethod -Uri '%BASE_URL%/blood-inventory' -Method Get | ConvertTo-Json"
echo.
echo.

echo ==========================
echo API Tests Complete!
echo ==========================
pause
