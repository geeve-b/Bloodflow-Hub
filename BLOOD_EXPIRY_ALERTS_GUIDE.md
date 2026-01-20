# Blood Unit Expiry Monitoring & Alert System

## Overview

The Blood Unit Expiry Monitoring & Alert System is a comprehensive feature that tracks blood unit expiration dates, calculates remaining days automatically, and generates real-time alerts at multiple severity levels. The system ensures no blood units are wasted and hospital staff receives timely notifications.

## Features

### 1. **Automatic Expiry Calculation**
- Tracks expiry date for each blood unit in inventory
- Automatically calculates days remaining
- Updates calculation in real-time

### 2. **Multi-Level Alert System**
Alerts are triggered at three severity levels:

| Level | Threshold | Color | Priority |
|-------|-----------|-------|----------|
| **Critical** | ≤ 1 day | 🔴 Red | Immediate action required |
| **Warning** | ≤ 3 days | 🟡 Yellow | Requires attention within 24 hours |
| **Info** | ≤ 7 days | 🔵 Blue | Plan for usage |

### 3. **Email Notifications**
- Automatic emails sent to all hospital staff
- Different email templates for each alert level
- Staff names and contact info included
- Detailed unit information and recommended actions
- Tracking of sent notifications

### 4. **Dashboard Visualization**
- Alert summary cards showing counts by severity level
- Affected blood types and hospitals
- Filterable alert list with search capability
- Alert acknowledgment and resolution tracking
- Historical alert management

### 5. **Real-Time Updates**
- Dashboard auto-refreshes every 5 minutes
- Manual refresh button available
- Alert status updates immediately
- Email delivery tracking

## System Architecture

### Database Schema

#### Blood Expiry Alert Collection
```typescript
{
  _id: ObjectId,
  inventoryId: string,           // Reference to blood inventory
  hospitalId: string,
  hospitalName: string,
  bloodType: string,             // O+, O-, A+, A-, B+, B-, AB+, AB-
  quantity: number,
  expiryDate: Date,
  daysRemaining: number,         // Auto-calculated
  alertLevel: "critical" | "warning" | "info",
  alertSentAt: Date,
  emailsSent: [{                  // Tracking of notifications
    email: string,
    staffName: string,
    sentAt: Date
  }],
  acknowledged: boolean,         // Staff acknowledgment
  acknowledgedBy?: string,
  acknowledgedAt?: Date,
  acknowledgedNotes?: string,
  resolved: boolean,             // Alert resolved/handled
  resolvedBy?: string,
  resolvedAt?: Date,
  resolvedNotes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints

#### Get All Active Alerts
```
GET /api/blood-expiry-alerts
Response: BloodExpiryAlert[]
```

#### Get Alert Summary (Dashboard)
```
GET /api/blood-expiry-alerts/summary
Response: {
  criticalAlerts: number,
  warningAlerts: number,
  infoAlerts: number,
  totalAlerts: number,
  affectedBloodTypes: string[],
  affectedHospitals: string[]
}
```

#### Get Alerts by Hospital
```
GET /api/blood-expiry-alerts/hospital/:hospitalId
Response: BloodExpiryAlert[]
```

#### Get Alerts by Severity Level
```
GET /api/blood-expiry-alerts/level/:level
Parameters: level = "critical" | "warning" | "info"
Response: BloodExpiryAlert[]
```

#### Get Specific Alert Details
```
GET /api/blood-expiry-alerts/:id
Response: BloodExpiryAlert
```

#### Acknowledge an Alert
```
POST /api/blood-expiry-alerts/:id/acknowledge
Body: {
  userId: string,
  notes?: string
}
Response: {
  message: string,
  alert: BloodExpiryAlert
}
```

#### Resolve an Alert
```
POST /api/blood-expiry-alerts/:id/resolve
Body: {
  userId: string,
  notes?: string
}
Response: {
  message: string,
  alert: BloodExpiryAlert
}
```

#### Trigger Expiry Check
```
POST /api/blood-expiry-alerts/check/create
Response: {
  message: string,
  alertsCreated: number,
  alertsUpdated: number,
  emailsSent: number
}
```

#### Delete an Alert
```
DELETE /api/blood-expiry-alerts/:id
Response: {
  message: string
}
```

## Implementation Details

### Backend Services

#### 1. **BloodExpiryService** (`server/bloodExpiryService.ts`)
Main service handling:
- Alert detection and creation
- Email notification dispatch
- Alert acknowledgment/resolution
- Dashboard summary generation

Key Methods:
- `checkAndCreateAlerts()` - Detects expiring units and creates alerts
- `sendAlertNotifications()` - Sends emails to hospital staff
- `getAlertSummary()` - Provides dashboard overview
- `acknowledgeAlert()` - Records staff acknowledgment
- `resolveAlert()` - Marks alert as resolved
- `calculateDaysRemaining()` - Computes days until expiry
- `getAlertLevel()` - Determines severity level

#### 2. **Storage Layer** (`server/storage.ts`)
Database operations:
- `getBloodExpiryAlert()` - Fetch single alert
- `getAllBloodExpiryAlerts()` - Get all alerts
- `getBloodExpiryAlertsByHospital()` - Filter by hospital
- `getBloodExpiryAlertsByLevel()` - Filter by severity
- `getActiveBloodExpiryAlerts()` - Get unresolved alerts
- `createBloodExpiryAlert()` - Create new alert
- `updateBloodExpiryAlert()` - Update alert data
- `acknowledgeBloodExpiryAlert()` - Mark as acknowledged
- `resolveBloodExpiryAlert()` - Mark as resolved
- `deleteBloodExpiryAlert()` - Remove alert
- `checkAndCreateExpiryAlerts()` - Auto-detect expirations

#### 3. **Email Service** (`server/email.ts`)
Function: `sendBloodExpiryAlertEmail()`
- Creates color-coded HTML emails
- Includes unit details and recommended actions
- Tailored messages for each alert level
- Notification delivery tracking

### Frontend Components

#### **BloodExpiryAlerts.tsx**
Main dashboard component featuring:
- Alert summary cards with color-coded statistics
- Affected resources display (blood types, hospitals)
- Filterable alert list
- Alert detail modal with full information
- Acknowledgment/resolution interface
- Real-time refresh capability
- Search and filter functionality

Features:
- Auto-refresh every 5 minutes
- Status tracking (active/acknowledged/resolved)
- Severity level filtering
- Email notification history
- User notes on actions taken
- Responsive design

## Usage Guide

### For Hospital Staff

#### 1. **Viewing Alerts**
1. Navigate to Hospital Staff Dashboard
2. Scroll to "Blood Inventory Expiry Alerts" section
3. View summary cards at top showing alert counts
4. See all active alerts in the list below

#### 2. **Understanding Alert Levels**
- **🔴 Critical (Red)**: Unit expires within 24 hours - use immediately or dispose
- **🟡 Warning (Yellow)**: Unit expires within 3 days - plan usage
- **🔵 Info (Blue)**: Unit expires within 7 days - monitor status

#### 3. **Acting on Alerts**
1. Click on an alert to open details
2. Review unit information and expiry date
3. Add notes about action taken
4. Click "Acknowledge" to mark as reviewed
5. Click "Mark as Resolved" when issue is handled

#### 4. **Using Filters**
- Filter by alert level (Critical, Warning, Info)
- Filter by status (Active, Acknowledged, Resolved)
- Click "Refresh" to manually update alert list

### For Administrators

#### 1. **Accessing Alerts**
1. Go to Admin Dashboard
2. Look for "Blood Expiry Alerts" section
3. Full overview of all hospital alerts available

#### 2. **Monitoring Hospital Performance**
- See which hospitals have expiring units
- Track alert acknowledgment rates
- Review resolution times
- Monitor email delivery

#### 3. **Triggering Manual Checks**
Use API endpoint or manual refresh:
```bash
curl -X POST http://localhost:5000/api/blood-expiry-alerts/check/create
```

## Alert Workflow

```
Blood Unit Added/Updated
        ↓
Background Check (Every 5 mins or manual trigger)
        ↓
Days Remaining Calculated
        ↓
Alert Level Determined
        ↓
Check if Alert Exists
        ├─ Yes: Update existing alert
        └─ No: Create new alert
        ↓
Email Notifications Sent
        ↓
Staff Receives Email Notification
        ↓
Alert Appears on Dashboard
        ↓
Staff Reviews and Acknowledges
        ↓
Staff Takes Action (Use/Dispose)
        ↓
Staff Marks Alert as Resolved
        ↓
Alert Moved to History
```

## Email Notification Example

### Critical Alert Email
**Subject**: [CRITICAL ALERT] Blood Expiry Alert - O+ Units at Central Hospital

**Content**:
- Blood Type: O+
- Quantity: 5 units
- Days Remaining: 1
- Expires: [Date]
- Recommended Actions:
  - Use this blood unit immediately if possible
  - Contact other departments that may need O+
  - If not used, properly dispose according to protocols

### Warning Alert Email
**Subject**: [WARNING] Blood Expiry Alert - A- Units at City Hospital

**Content**:
- Blood Type: A-
- Quantity: 3 units
- Days Remaining: 2
- Expires: [Date]
- Recommended Actions:
  - Review current patient needs for A-
  - Coordinate with other departments for potential use
  - Plan for unit usage within the next 3 days

### Info Alert Email
**Subject**: [REMINDER] Blood Expiry Alert - AB+ Units at Regional Hospital

**Content**:
- Blood Type: AB+
- Quantity: 2 units
- Days Remaining: 5
- Expires: [Date]
- Recommended Actions:
  - Monitor this blood unit's status
  - Plan for usage or safe disposal
  - Check inventory system for updates

## Scheduling Automated Checks

To run checks automatically (example with node-schedule):

```typescript
import schedule from 'node-schedule';
import { bloodExpiryService } from './bloodExpiryService';

// Check every hour
schedule.scheduleJob('0 * * * *', async () => {
  try {
    console.log('Running scheduled expiry check...');
    await bloodExpiryService.checkAndCreateAlerts();
  } catch (error) {
    console.error('Scheduled check failed:', error);
  }
});

// Or daily at 8 AM
schedule.scheduleJob('0 8 * * *', async () => {
  try {
    const summary = await bloodExpiryService.getAlertSummary();
    console.log('Daily expiry summary:', summary);
  } catch (error) {
    console.error('Daily check failed:', error);
  }
});
```

## Best Practices

### 1. **Regular Inventory Updates**
- Update blood inventory immediately upon receipt
- Ensure expiry dates are accurate in the system
- Remove expired units from system promptly

### 2. **Staff Training**
- Educate staff on alert level meanings
- Establish protocols for each alert level
- Ensure all staff check dashboard daily

### 3. **Email Configuration**
- Verify SMTP settings for email delivery
- Test email sending with test accounts
- Monitor email bounce rates

### 4. **Alert Management**
- Acknowledge alerts promptly
- Add detailed notes when resolving
- Review alert history regularly
- Identify patterns for waste reduction

### 5. **System Monitoring**
- Check alert accuracy regularly
- Verify days remaining calculations
- Ensure all hospitals receive notifications
- Monitor dashboard usage

## Troubleshooting

### Alerts Not Appearing
1. Check blood inventory has correct expiry dates
2. Verify database connection
3. Run manual check: `POST /api/blood-expiry-alerts/check/create`
4. Check browser console for errors

### Emails Not Sending
1. Verify SMTP configuration in `.env`
2. Check hospital staff have email addresses
3. Review email service logs
4. Test with API endpoint directly

### Incorrect Days Remaining
1. Verify blood inventory expiry dates
2. Check system time is correct
3. Database calculation might need refresh
4. Clear browser cache and refresh

### Alerts Not Updating
1. Refresh dashboard manually
2. Check auto-refresh is enabled (5 min interval)
3. Verify API endpoints are responding
4. Check browser console for network errors

## Performance Considerations

- **Alert Creation**: O(n) where n = expiring units
- **Email Sending**: Asynchronous, non-blocking
- **Dashboard Load**: Dashboard queries optimized with indexes
- **Real-time Updates**: 5-minute auto-refresh prevents excessive loads
- **Storage Optimization**: Resolved alerts can be archived after retention period

## Future Enhancements

1. **SMS Notifications** - Critical alerts via SMS
2. **Webhook Integration** - Send alerts to external systems
3. **Alert History Archive** - Long-term storage of resolved alerts
4. **Custom Alert Thresholds** - Per-hospital customization
5. **Predictive Analytics** - Forecast expiry patterns
6. **Integration with Inventory Management** - Auto-adjust quantities
7. **Multi-language Support** - Localized email templates
8. **Slack Integration** - Real-time Slack notifications
9. **Custom Reports** - Expiry trends and waste analysis
10. **QR Code Integration** - Quick unit identification

## Technical Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **Email**: Nodemailer with SMTP
- **Frontend**: React, TypeScript
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## Support & Maintenance

For issues or questions:
1. Check logs in server console
2. Review email service logs
3. Test API endpoints directly
4. Verify database indexes exist
5. Contact system administrator

## API Examples

### Check and Create Alerts
```bash
curl -X POST http://localhost:5000/api/blood-expiry-alerts/check/create \
  -H "Content-Type: application/json"
```

### Get Alert Summary
```bash
curl http://localhost:5000/api/blood-expiry-alerts/summary
```

### Acknowledge Alert
```bash
curl -X POST http://localhost:5000/api/blood-expiry-alerts/alert-id/acknowledge \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id","notes":"Unit will be used today"}'
```

### Resolve Alert
```bash
curl -X POST http://localhost:5000/api/blood-expiry-alerts/alert-id/resolve \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id","notes":"Unit was successfully transfused"}'
```
