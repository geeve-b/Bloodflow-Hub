# Test script for blood request notification feature

$API_URL = "http://localhost:3001/api"

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Blood Request Notification Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# First, get all donors to see what's in the database
Write-Host "[1] Fetching all donors..." -ForegroundColor $Yellow

try {
    $response = Invoke-RestMethod -Uri "$API_URL/donors" -Method Get
    Write-Host "Found $($response.Length) donors in database" -ForegroundColor $Green
    
    if ($response.Length -gt 0) {
        Write-Host "Donors:" -ForegroundColor Cyan
        $response | ForEach-Object {
            Write-Host "  - $($_.firstName) $($_.lastName): Blood Type $($_.bloodType), Active: $($_.isActive), UserId: $($_.userId)" -ForegroundColor Gray
        }
    } else {
        Write-Host "No donors found in database!" -ForegroundColor $Red
    }
} catch {
    Write-Host "Error fetching donors: $_" -ForegroundColor $Red
}

Write-Host ""
Write-Host "[2] Fetching all users..." -ForegroundColor $Yellow

try {
    $response = Invoke-RestMethod -Uri "$API_URL/users" -Method Get
    Write-Host "Found $($response.Length) users in database" -ForegroundColor $Green
    
    if ($response.Length -gt 0) {
        Write-Host "Users:" -ForegroundColor Cyan
        $response | ForEach-Object {
            Write-Host "  - $($_.username): $($_.email), Role: $($_.role)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "Error fetching users: $_" -ForegroundColor $Red
}

Write-Host ""
Write-Host "[3] Creating a test blood request..." -ForegroundColor $Yellow

# Create a test blood request
$bloodRequestData = @{
    requesterId = "test-user-123"
    requesterName = "Test Requester"
    hospitalName = "Test Hospital"
    bloodType = "O+"
    quantity = 2
    urgency = "high"
    reason = "Test blood request"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/blood-requests" -Method Post `
        -ContentType "application/json" `
        -Body $bloodRequestData
    
    Write-Host "Blood request created successfully!" -ForegroundColor $Green
    Write-Host "Request ID: $($response._id)" -ForegroundColor Gray
} catch {
    Write-Host "Error creating blood request: $_" -ForegroundColor $Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete - Check server logs for details" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
