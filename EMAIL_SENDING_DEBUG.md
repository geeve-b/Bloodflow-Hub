# Email Sending Debug Guide

## Changes Made

✅ **Removed isActive criteria** - Donors with `isActive: false` or undefined will still receive emails  
✅ **Removed email validation criteria** - Function no longer skips donors without valid emails  
✅ **Removed region/location filtering** - All eligible donors receive emails regardless of location  

---

## Current Email Sending Flow (Updated)

### Step 1: Find All Donors with Matching Blood Types
```javascript
// Query: Find ALL donors with compatible blood types
const query = { bloodType: { $in: ["O-", "O+"] } };
const donors = await db.collection("donors").find(query).toArray();
// No filters applied here - gets ALL donors with matching blood type
```

### Step 2: Filter Donors (Blood Type Only)
```javascript
const filteredDonors = donors.filter((donorDoc) => {
  const donor = normalize<Donor>(donorDoc);
  // Simply check if can be normalized - no other filtering
  return donor !== null;
});
```

### Step 3: Fetch Email for Each Donor
```javascript
for (each donorDoc in filteredDonors) {
  // Priority 1: Try to get email from users collection via userId
  const user = await db.collection("users").findOne({ _id: userId });
  if (user && user.email) {
    userEmail = user.email;  // ✅ USE THIS
  }
  
  // Priority 2: Check if donor record has email field
  else if (donorDoc.email) {
    userEmail = donorDoc.email;  // ✅ USE THIS
  }
  
  // Priority 3: Use fallback format (will likely fail)
  else {
    userEmail = `noemail-firstName.lastName@bloodflow.local`;
    // ⚠️ This will probably cause email sending to fail
  }
}
```

### Step 4: Send Email
```javascript
// Email is sent with whatever address was found/generated
sendBloodRequestNotification({
  donorEmail: userEmail,  // Could be real, missing, or fallback
  donorName: donor name,
  // ... other fields
})
```

---

## Troubleshooting Checklist

### Issue 1: Donors Are Not Being Found At All

**Check:**
1. Verify donors exist in database
   ```
   Look in MongoDB → bloodflow_hub.donors
   Check if any donor records exist
   ```

2. Look for this debug log when creating blood request:
   ```
   [DEBUG] Found 0 donors for blood types O-, O+
   ```
   If you see this, **donors don't exist** in database yet.

**Solution:** Create test donor records first

---

### Issue 2: Donors Found But No Emails

**Check:**
1. Look for these debug logs:
   ```
   [DEBUG] Found 5 donors for blood types O-, O+
   [DEBUG] After filtering: 5 donors eligible
   [DEBUG] Processing donor: John Doe, userId: 507f1f77bcf86cd799439011
   [DEBUG] Could not fetch user for donor...
   [DEBUG] WARNING: No email found for donor John Doe
   ```

2. Verify users collection has records:
   ```
   Look in MongoDB → bloodflow_hub.users
   Check if user records exist with emails populated
   ```

3. Check if userId match is correct:
   ```
   donors.userId should match users._id exactly as ObjectId
   ```

**Solution:**
- Ensure users are created before/with donors
- Verify userId field in donors collection matches users._id
- Populate `users.email` field for all user accounts

---

### Issue 3: Email Found But Not Sending

**Check:**
1. Look for these logs:
   ```
   [DEBUG] Will send notification to user@example.com for donor John Doe
   [DEBUG] sendBloodRequestNotification called with donorEmail: "user@example.com"
   ```

2. Then check for these errors:
   ```
   [ERROR] Failed to send email to user@example.com: [error message]
   [ERROR] SMTP error...
   ```

**Solution:**
- Verify SMTP configuration:
  ```
  SMTP_HOST=your.smtp.server
  SMTP_PORT=587 or 465
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-password
  SMTP_FROM_EMAIL=noreply@yourdomain.com
  ```

- For Gmail, use:
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-gmail@gmail.com
  SMTP_PASS=your-16-character-app-password
  ```

---

## Complete Debug Process

### Step 1: Enable Logging
Monitor console output for these key logs:

```
# When blood request is created:
[DEBUG] Starting async notification for blood type: O+
[DEBUG] Found X donors for blood types O-, O+
[DEBUG] After filtering: Y donors eligible

# For each donor:
[DEBUG] Processing donor: John Doe, userId: 507f1f77bcf86cd799439011
[DEBUG] Found email john@example.com for donor John Doe
[DEBUG] Will send notification to john@example.com for donor John Doe

# When sending email:
[DEBUG] sendBloodRequestNotification called with donorEmail: "john@example.com"
[DEBUG] Sending blood request notification to john@example.com
[DEBUG] Blood request notification sent successfully to john@example.com
```

### Step 2: Test Manually

Create a blood request via API:
```bash
curl -X POST http://localhost:5000/api/blood-requests \
  -H "Content-Type: application/json" \
  -d '{
    "bloodType": "O+",
    "quantity": 2,
    "region": "California",
    "state": "CA",
    "country": "USA",
    "hospitalName": "Test Hospital",
    "requesterName": "Dr. Smith",
    "patientName": "John Smith",
    "contactNumber": "555-0123",
    "reason": "Surgery"
  }'
```

### Step 3: Monitor Output

Watch terminal for:
1. Were donors found?
2. Were emails fetched?
3. Did emails send or fail?
4. What was the error message?

---

## Email Criteria Summary

| Criteria | Before | After | Purpose |
|----------|--------|-------|---------|
| Blood Type Match | ✅ REQUIRED | ✅ REQUIRED | Ensure compatibility |
| Eligibility Status | ✅ "eligible" only | ❌ REMOVED | Accept all statuses |
| Active Status | ✅ true only | ❌ REMOVED | Accept inactive donors |
| Region Match | ✅ REQUIRED | ❌ REMOVED | Send to all locations |
| Email Exists | ✅ REQUIRED | ❌ REMOVED* | Still needed to send, but will use fallback |

*Email is still needed to actually send the email, but function won't skip donors if email is missing

---

## Expected Behavior After Changes

**When a blood request for "O+" is created:**

1. ✅ Query finds ALL "O-" and "O+" donors (no status/location filter)
2. ✅ No donors are filtered out (all pass blood type filter)  
3. ✅ For each donor, try to get email from users collection
4. ✅ If no email found, fall back to `noemail-firstname.lastname@bloodflow.local`
5. ✅ Send notification to all email addresses (will fail for fallback emails)
6. ⚠️ Watch logs for actual email sending failures

---

## Next Steps for Testing

1. **Verify Database Structure**
   - Go to MongoDB Compass or Atlas
   - Check `bloodflow_hub.donors` - count how many exist
   - Check `bloodflow_hub.users` - count how many exist
   - Check if `users.email` is populated

2. **Monitor Console Logs**
   - Create a test blood request
   - Watch for all [DEBUG] logs listed above
   - Note which step fails

3. **Check SMTP Configuration**
   - Print `.env` file (don't expose credentials)
   - Verify all SMTP_* variables are set
   - Test email service separately if possible

4. **Check Email Sending Function**
   - Look for `[ERROR] Failed to send email` messages
   - Share the full error message for diagnosis

---

## Common Issues & Solutions

| Issue | Debug Log | Solution |
|-------|-----------|----------|
| No donors found | `Found 0 donors` | Create donor records first |
| Users not found | `No user found for donor` | Create user accounts, link via userId |
| No emails on users | `No email found for donor` | Populate `users.email` field |
| SMTP not configured | `Using Ethereal test account` | Set SMTP_* env variables |
| Email sending fails | `[ERROR] Failed to send email` | Check SMTP credentials |
| Invalid email format | `WARNING: Using fallback email` | Ensure users have valid email addresses |

