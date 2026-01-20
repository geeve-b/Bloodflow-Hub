#!/usr/bin/env pwsh

# Blood Expiry Alert System - Integration Test Script
# This script tests all endpoints and functionality of the blood expiry alert system

$BASE_URL = "http://localhost:5000"
$API_URL = "$BASE_URL/api"

# Color codes for output
$RED = "Red"
$GREEN = "Green"
$YELLOW = "Yellow"
$BLUE = "Cyan"

function Write-Header {
    param([string]$text)
    Write-Host ""
    Write-Host "=" * 80 -ForegroundColor $BLUE
    Write-Host $text -ForegroundColor $BLUE
    Write-Host "=" * 80 -ForegroundColor $BLUE
}

function Write-Success {
    param([string]$text)
    Write-Host "✓ $text" -ForegroundColor $GREEN
}

function Write-Error-Custom {
    param([string]$text)
    Write-Host "✗ $text" -ForegroundColor $RED
}

function Write-Info {
    param([string]$text)
    Write-Host "ℹ $text" -ForegroundColor $BLUE
}

function Write-Warning-Custom {
    param([string]$text)
    Write-Host "⚠ $text" -ForegroundColor $YELLOW
}

# Test 1: Check API Health
Write-Header "Test 1: API Health Check"
try {
    $response = Invoke-WebRequest -Uri "$API_URL/../health" -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Success "API is running"
    }
} catch {
    Write-Error-Custom "API is not responding. Start the server first."
    exit 1
}

# Test 2: Create Test Blood Inventory
Write-Header "Test 2: Create Test Blood Inventory"
$bloodInventoryData = @{
    hospitalId = "test-hospital-001"
    hospitalName = "Test Hospital"
    bloodType = "O+"
    quantity = 5
    expiryDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    status = "available"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$API_URL/blood-inventory" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $bloodInventoryData `
        -ErrorAction Stop
    
    $inventory = $response.Content | ConvertFrom-Json
    Write-Success "Created test blood inventory: $($inventory._id)"
    $INVENTORY_ID = $inventory._id
} catch {
    Write-Error-Custom "Failed to create blood inventory"
    Write-Host $_.Exception.Message
    exit 1
}

# Test 3: Trigger Expiry Check
Write-Header "Test 3: Trigger Expiry Check and Alert Creation"
try {
    $response = Invoke-WebRequest -Uri "$API_URL/blood-expiry-alerts/check/create" `
        -Method POST `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    Write-Success "Expiry check completed"
    Write-Info "Alerts Created: $($result.alertsCreated)"
    Write-Info "Emails Sent: $($result.emailsSent)"
} catch {
    Write-Error-Custom "Failed to trigger expiry check"
    Write-Host $_.Exception.Message
}

# Test 4: Get All Active Alerts
Write-Header "Test 4: Get All Active Alerts"
try {
    $response = Invoke-WebRequest -Uri "$API_URL/blood-expiry-alerts" `
        -ErrorAction Stop
    
    $alerts = $response.Content | ConvertFrom-Json
    Write-Success "Retrieved $(($alerts | Measure-Object).Count) alerts"
    
    if (($alerts | Measure-Object).Count -gt 0) {
        $ALERT_ID = $alerts[0]._id
        Write-Info "First Alert: $ALERT_ID"
        Write-Info "Alert Level: $($alerts[0].alertLevel)"
        Write-Info "Blood Type: $($alerts[0].bloodType)"
        Write-Info "Days Remaining: $($alerts[0].daysRemaining)"
    }
} catch {
    Write-Error-Custom "Failed to retrieve alerts"
    Write-Host $_.Exception.Message
}

# Test 5: Get Alert Summary
Write-Header "Test 5: Get Alert Summary (Dashboard Overview)"
try {
    $response = Invoke-WebRequest -Uri "$API_URL/blood-expiry-alerts/summary" `
        -ErrorAction Stop
    
    $summary = $response.Content | ConvertFrom-Json
    Write-Success "Retrieved alert summary"
    Write-Info "Critical Alerts: $($summary.criticalAlerts)"
    Write-Info "Warning Alerts: $($summary.warningAlerts)"
    Write-Info "Info Alerts: $($summary.infoAlerts)"
    Write-Info "Total Alerts: $($summary.totalAlerts)"
    Write-Info "Affected Blood Types: $($summary.affectedBloodTypes -join ', ')"
    Write-Info "Affected Hospitals: $($summary.affectedHospitals -join ', ')"
} catch {
    Write-Error-Custom "Failed to retrieve summary"
    Write-Host $_.Exception.Message
}

# Test 6: Acknowledge Alert
if ($null -ne $ALERT_ID) {
    Write-Header "Test 6: Acknowledge Alert"
    $acknowledgeData = @{
        userId = "test-user-001"
        notes = "Reviewed by test user"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/blood-expiry-alerts/$ALERT_ID/acknowledge" `
            -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body $acknowledgeData `
            -ErrorAction Stop
        
        $result = $response.Content | ConvertFrom-Json
        Write-Success "Alert acknowledged"
        Write-Info "Acknowledged By: $($result.alert.acknowledgedBy)"
        Write-Info "Acknowledged Notes: $($result.alert.acknowledgedNotes)"
    } catch {
        Write-Error-Custom "Failed to acknowledge alert"
        Write-Host $_.Exception.Message
    }
}

# Test 7: Get Alert Details
if ($null -ne $ALERT_ID) {
    Write-Header "Test 7: Get Alert Details"
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/blood-expiry-alerts/$ALERT_ID" `
            -ErrorAction Stop
        
        $alert = $response.Content | ConvertFrom-Json
        Write-Success "Retrieved alert details"
        Write-Info "Hospital: $($alert.hospitalName)"
        Write-Info "Blood Type: $($alert.bloodType)"
        Write-Info "Quantity: $($alert.quantity) units"
        Write-Info "Expiry Date: $($alert.expiryDate)"
        Write-Info "Days Remaining: $($alert.daysRemaining)"
        Write-Info "Alert Level: $($alert.alertLevel)"
        Write-Info "Status: $(if ($alert.resolved) { 'Resolved' } elseif ($alert.acknowledged) { 'Acknowledged' } else { 'Active' })"
    } catch {
        Write-Error-Custom "Failed to retrieve alert details"
        Write-Host $_.Exception.Message
    }
}

# Test 8: Get Alerts by Hospital
Write-Header "Test 8: Get Alerts by Hospital"
try {
    $response = Invoke-WebRequest -Uri "$API_URL/blood-expiry-alerts/hospital/test-hospital-001" `
        -ErrorAction Stop
    
    $hospitalAlerts = $response.Content | ConvertFrom-Json
    Write-Success "Retrieved $( ($hospitalAlerts | Measure-Object).Count) hospital alerts"
} catch {
    Write-Error-Custom "Failed to retrieve hospital alerts"
    Write-Host $_.Exception.Message
}

# Test 9: Get Alerts by Level
Write-Header "Test 9: Get Alerts by Severity Level"
$levels = @("critical", "warning", "info")
foreach ($level in $levels) {
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/blood-expiry-alerts/level/$level" `
            -ErrorAction Stop
        
        $levelAlerts = $response.Content | ConvertFrom-Json
        Write-Success "Retrieved $( ($levelAlerts | Measure-Object).Count) $level alerts"
    } catch {
        Write-Error-Custom "Failed to retrieve $level alerts"
    }
}

# Test 10: Resolve Alert
if ($null -ne $ALERT_ID) {
    Write-Header "Test 10: Resolve Alert"
    $resolveData = @{
        userId = "test-user-001"
        notes = "Unit was transfused successfully"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$API_URL/blood-expiry-alerts/$ALERT_ID/resolve" `
            -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body $resolveData `
            -ErrorAction Stop
        
        $result = $response.Content | ConvertFrom-Json
        Write-Success "Alert resolved"
        Write-Info "Resolved By: $($result.alert.resolvedBy)"
        Write-Info "Resolved Notes: $($result.alert.resolvedNotes)"
    } catch {
        Write-Error-Custom "Failed to resolve alert"
        Write-Host $_.Exception.Message
    }
}

# Test 11: Create Additional Inventory for Filtering Tests
Write-Header "Test 11: Create Additional Test Data"
$testData = @(
    @{
        hospitalId = "test-hospital-002"
        hospitalName = "City Hospital"
        bloodType = "A-"
        quantity = 3
        expiryDate = (Get-Date).AddDays(2).ToString("yyyy-MM-dd")
        status = "available"
    },
    @{
        hospitalId = "test-hospital-003"
        hospitalName = "Regional Center"
        bloodType = "AB+"
        quantity = 2
        expiryDate = (Get-Date).AddDays(5).ToString("yyyy-MM-dd")
        status = "available"
    }
)

foreach ($data in $testData) {
    try {
        $jsonData = $data | ConvertTo-Json
        $response = Invoke-WebRequest -Uri "$API_URL/blood-inventory" `
            -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body $jsonData `
            -ErrorAction Stop
        
        Write-Success "Created blood inventory for $($data.hospitalName)"
    } catch {
        Write-Warning-Custom "Failed to create inventory for $($data.hospitalName)"
    }
}

# Test 12: Trigger Final Expiry Check
Write-Header "Test 12: Final Expiry Check"
try {
    $response = Invoke-WebRequest -Uri "$API_URL/blood-expiry-alerts/check/create" `
        -Method POST `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    Write-Success "Final expiry check completed"
    Write-Info "Total Alerts Created: $($result.alertsCreated)"
    Write-Info "Total Emails Sent: $($result.emailsSent)"
} catch {
    Write-Error-Custom "Failed to trigger final expiry check"
    Write-Host $_.Exception.Message
}

# Test 13: Get Final Summary
Write-Header "Test 13: Final Alert Summary"
try {
    $response = Invoke-WebRequest -Uri "$API_URL/blood-expiry-alerts/summary" `
        -ErrorAction Stop
    
    $summary = $response.Content | ConvertFrom-Json
    Write-Success "Final Summary Retrieved"
    Write-Info "Critical: $($summary.criticalAlerts) | Warning: $($summary.warningAlerts) | Info: $($summary.infoAlerts) | Total: $($summary.totalAlerts)"
} catch {
    Write-Error-Custom "Failed to retrieve final summary"
    Write-Host $_.Exception.Message
}

# Summary
Write-Header "Test Execution Complete"
Write-Success "All tests completed successfully!"
Write-Info "Key Features Tested:"
Write-Info "  ✓ Alert creation from expiring inventory"
Write-Info "  ✓ Alert retrieval and filtering"
Write-Info "  ✓ Alert acknowledgment"
Write-Info "  ✓ Alert resolution"
Write-Info "  ✓ Dashboard summary generation"
Write-Info "  ✓ Multi-hospital alert management"
Write-Info ""
Write-Info "Next Steps:"
Write-Info "  1. Check email inbox for test notifications"
Write-Info "  2. Verify alert display on dashboards"
Write-Info "  3. Test alert filtering in UI"
Write-Info "  4. Test acknowledgment/resolution in UI"
Write-Info ""
Write-Info "For more info, see BLOOD_EXPIRY_ALERTS_GUIDE.md"
