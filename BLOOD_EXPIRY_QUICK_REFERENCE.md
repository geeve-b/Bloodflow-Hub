# Blood Expiry Alert System - Quick Reference

## Feature Summary

The blood expiry monitoring system automatically tracks blood unit expiration and generates intelligent alerts at three severity levels with automatic email notifications.

## Key Components

### 1. Backend Service
**File**: `server/bloodExpiryService.ts`
- Detects expiring blood units
- Creates alerts automatically
- Sends email notifications
- Manages alert lifecycle

### 2. Database Layer
**File**: `server/storage.ts`
- Stores blood expiry alerts
- Tracks alert history
- Manages acknowledgments and resolutions

### 3. Email Service
**File**: `server/email.ts` → `sendBloodExpiryAlertEmail()`
- Creates color-coded email templates
- Sends to all hospital staff
- Includes unit details and actions

### 4. API Endpoints
**File**: `server/routes.ts` → `/api/blood-expiry-alerts/*`
- RESTful endpoints for alert management
- Real-time data access

### 5. Dashboard Component
**File**: `client/src/components/dashboard/BloodExpiryAlerts.tsx`
- Displays alerts with filtering
- Shows summary statistics
- Handles acknowledgment/resolution
- Auto-refreshes every 5 minutes

### 6. Dashboard Integration
**Files**: 
- `client/src/pages/AdminDashboard.tsx`
- `client/src/pages/HospitalStaffDashboard.tsx`

## Alert Thresholds

```
Critical: ≤ 1 day remaining
Warning:  ≤ 3 days remaining
Info:     ≤ 7 days remaining
```

## API Endpoints

```
GET  /api/blood-expiry-alerts                  → Get all active alerts
GET  /api/blood-expiry-alerts/summary          → Dashboard summary
GET  /api/blood-expiry-alerts/:id              → Get alert details
GET  /api/blood-expiry-alerts/hospital/:id     → Hospital's alerts
GET  /api/blood-expiry-alerts/level/:level     → Alerts by severity
POST /api/blood-expiry-alerts/:id/acknowledge  → Mark acknowledged
POST /api/blood-expiry-alerts/:id/resolve      → Mark resolved
POST /api/blood-expiry-alerts/check/create     → Trigger alert check
DEL  /api/blood-expiry-alerts/:id              → Delete alert
```

## Database Collection

```
Collection: bloodExpiryAlerts
- inventoryId (string)
- hospitalId (string)
- hospitalName (string)
- bloodType (string)
- quantity (number)
- expiryDate (Date)
- daysRemaining (number) - Auto-calculated
- alertLevel (enum: critical|warning|info)
- alertSentAt (Date)
- emailsSent (array) - Tracking of notifications
- acknowledged (boolean)
- acknowledgedBy (string)
- acknowledgedAt (Date)
- acknowledgedNotes (string)
- resolved (boolean)
- resolvedBy (string)
- resolvedAt (Date)
- resolvedNotes (string)
```

## Configuration Required

### Environment Variables (.env)
```
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@bloodflowhub.com
SMTP_FROM_NAME=LifeFlow

# Database
DATABASE_URL=mongodb+srv://...
```

## Usage Flow

1. **Alert Detection**
   - System checks blood inventory every 5 minutes (or manually)
   - Identifies units expiring within 7 days
   - Creates alert if not already existing

2. **Email Notification**
   - Alert triggered
   - Emails sent to all hospital staff
   - Status tracked in alert record

3. **Dashboard Display**
   - Alert appears on dashboards
   - Color-coded by severity
   - Summary cards updated

4. **Staff Action**
   - Staff reviews alert
   - Acknowledges receipt
   - Takes action (use/dispose)
   - Resolves when handled

5. **Archival**
   - Resolved alerts can be deleted
   - Historical data retained for reporting

## File Structure

```
server/
├── bloodExpiryService.ts    (Alert service logic)
├── email.ts                  (Email notifications)
├── storage.ts                (Database operations)
└── routes.ts                 (API endpoints)

client/src/
├── components/dashboard/
│   └── BloodExpiryAlerts.tsx (Dashboard component)
├── pages/
│   ├── AdminDashboard.tsx
│   └── HospitalStaffDashboard.tsx
└── context/
    └── AuthContext.tsx       (User authentication)

shared/
└── schema.ts                 (Type definitions)

root/
├── BLOOD_EXPIRY_ALERTS_GUIDE.md      (Full documentation)
├── test-blood-expiry-alerts.ps1      (Test script)
└── setup-blood-expiry-alerts.sh      (Setup script)
```

## Dashboard Features

### Summary Cards
- Critical alerts count
- Warning alerts count
- Info alerts count
- Total active alerts

### Affected Resources
- Blood types in alerts
- Hospitals with alerts

### Alert List
- Filterable by severity level
- Filterable by status (active/acknowledged/resolved)
- Sortable and searchable
- Color-coded indicators

### Alert Details
- Full unit information
- Expiry countdown
- Email notification history
- Action buttons
- Notes field

## Common Tasks

### Trigger Manual Check
```bash
curl -X POST http://localhost:5000/api/blood-expiry-alerts/check/create
```

### Get Dashboard Summary
```bash
curl http://localhost:5000/api/blood-expiry-alerts/summary
```

### Acknowledge Alert
```bash
curl -X POST http://localhost:5000/api/blood-expiry-alerts/ALERT_ID/acknowledge \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","notes":"Action required"}'
```

### Get Hospital Alerts
```bash
curl http://localhost:5000/api/blood-expiry-alerts/hospital/HOSPITAL_ID
```

## Testing

Run test script:
```bash
# PowerShell
PowerShell -File test-blood-expiry-alerts.ps1

# Bash
bash test-blood-expiry-alerts.sh
```

Tests cover:
- Alert creation
- Alert retrieval
- Alert filtering
- Acknowledgment
- Resolution
- Email sending

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No alerts appearing | Run manual check: POST /api/blood-expiry-alerts/check/create |
| Emails not sending | Verify SMTP config in .env |
| Dashboard not updating | Check auto-refresh (5 min), clear cache |
| Incorrect days remaining | Verify expiry dates in inventory |
| High alert volume | Adjust thresholds in bloodExpiryService.ts |

## Performance Tips

- Dashboard queries optimized for performance
- Email sending is asynchronous
- Database indexes on alertLevel and hospitalId
- Cache refreshes every 5 minutes
- Resolved alerts can be deleted after retention period

## Email Templates

### Critical Alert
- Red background, urgent tone
- Immediate action recommended
- Clear unit information
- Use/dispose instructions

### Warning Alert
- Yellow background, caution tone
- Action within 24 hours
- Planning recommendations
- Unit coordination tips

### Info Alert
- Blue background, informational tone
- Monitor status
- Plan accordingly
- Standard information

## Scheduling (Optional)

To run checks automatically, add to your scheduler:

```javascript
// Every hour
schedule.scheduleJob('0 * * * *', () => 
  bloodExpiryService.checkAndCreateAlerts()
);

// Daily at 8 AM
schedule.scheduleJob('0 8 * * *', () =>
  bloodExpiryService.getAlertSummary()
);
```

## Features Implemented

✅ Automatic expiry calculation
✅ Multi-level alert system (3 thresholds)
✅ Email notifications with HTML templates
✅ Dashboard visualization
✅ Real-time updates (5-min auto-refresh)
✅ Alert acknowledgment tracking
✅ Alert resolution tracking
✅ Hospital staff filtering
✅ Blood type filtering
✅ Severity level filtering
✅ Status filtering (active/acknowledged/resolved)
✅ Email delivery tracking
✅ Responsive design
✅ No duplicate alerts
✅ Accurate calculations

## Future Enhancements

- SMS notifications for critical alerts
- Webhook integration
- Custom alert thresholds per hospital
- Predictive expiry analytics
- QR code scanning integration
- Multi-language support
- Slack integration
- Alert history archive
- Waste analytics
- Mobile app notifications

## Support

For issues:
1. Check BLOOD_EXPIRY_ALERTS_GUIDE.md
2. Review server logs
3. Test API endpoints
4. Verify email configuration
5. Contact administrator

---

**Last Updated**: January 2026
**Version**: 1.0
**Status**: Production Ready
