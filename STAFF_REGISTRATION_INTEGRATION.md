# Staff Registration to Dashboard Integration Guide

## Complete Workflow Overview

```
Staff Registration Flow
    ↓
Form Submission (10 fields)
    ↓
API: POST /api/register (User account)
    ↓
API: POST /api/staff (Staff profile)
    ↓
Email Verification
    ↓
Role-based Redirect (Hospital Staff → Dashboard)
    ↓
Hospital Staff Dashboard Access
    ↓
View & Manage Blood Requests
```

## Step-by-Step Integration

### Phase 1: Registration (StaffRegisterPage.tsx)

#### Form Fields
1. **Full Name** - Input field
2. **Staff ID** - Unique identifier
3. **Gender** - Radio group (Male/Female/Other)
4. **Contact Number** - Phone input with validation
5. **Email** - Email input with validation
6. **Address** - Textarea
7. **Username** - Unique username for login
8. **Designation/Role** - Select dropdown (Doctor, Nurse, Technician, Receptionist)
9. **Password** - Password input with strength indicator
10. **Confirm Password** - Password confirmation

#### Validation Rules
```typescript
const validationRules = {
  fullName: { required: true, minLength: 3, maxLength: 100 },
  staffId: { required: true, minLength: 3, maxLength: 50, unique: true },
  gender: { required: true },
  contactNumber: { required: true, pattern: /^\d{10}$/ },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, unique: true },
  address: { required: true, minLength: 5, maxLength: 200 },
  username: { required: true, minLength: 3, maxLength: 50, unique: true },
  designation: { required: true },
  password: { required: true, minLength: 8, pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ },
  confirmPassword: { required: true, mustMatch: "password" },
};
```

#### API Calls

**Call 1: Register User Account**
```typescript
POST /api/register
Content-Type: application/json

{
  "username": "john.doe",
  "password": "SecurePass123!",
  "email": "john.doe@hospital.com",
  "role": "hospital"
}

Response:
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john.doe",
    "email": "john.doe@hospital.com",
    "role": "hospital",
    "emailVerified": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Registration successful. Verification email sent."
}
```

**Call 2: Create Staff Profile**
```typescript
POST /api/staff
Content-Type: application/json
Authorization: Bearer {token}

{
  "userId": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "staffId": "HOS-2024-001",
  "department": "General",
  "position": "Doctor",
  "phone": "9876543210",
  "email": "john.doe@hospital.com",
  "hospitalName": "City General Hospital",
  "address": "123 Healthcare St, Medical City"
}

Response:
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "staffId": "HOS-2024-001",
  "position": "Doctor",
  "hospitalName": "City General Hospital",
  "createdAt": "2024-01-15T10:31:00Z"
}
```

### Phase 2: Email Verification (VerifyEmailPage.tsx)

#### Verification Flow
1. User receives 6-digit code via email
2. User enters code in verification form
3. Code validated against stored verification record
4. Email marked as verified in user database

#### API Call
```typescript
POST /api/verify-email
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "code": "123456"
}

Response:
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john.doe",
    "email": "john.doe@hospital.com",
    "role": "hospital",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Email verified successfully"
}
```

#### Role-Based Redirect
```typescript
// After successful verification
if (apiUser.role === "hospital") {
  setLocation("/hospital-dashboard");
} else {
  setLocation("/dashboard");
}
```

### Phase 3: Hospital Staff Dashboard (HospitalStaffDashboard.tsx)

#### Dashboard Access Control
```typescript
// Check authentication
if (!user) {
  setLocation("/login");
  return;
}

// Check role
if (user.role !== "hospital") {
  return (
    <AccessDeniedCard />
  );
}
```

#### Data Fetching
```typescript
// Fetch staff profile
GET /api/profile/{userId}/hospital
Response: StaffProfile object with name, position, hospitalName, etc.

// Fetch blood requests
GET /api/blood-requests
Response: Array of BloodRequest objects
```

#### Dashboard Display
- Staff profile information in header
- Statistics cards (Active Requests, Critical Cases, Total Requests)
- Filterable blood requests table
- View Details modal for request information

## Database Interactions

### User Collection
```javascript
{
  _id: ObjectId,
  username: String,
  password: String (hashed),
  email: String,
  role: "hospital",
  emailVerified: Boolean,
  verificationCode: String,
  verificationCodeExpiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Staff Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  firstName: String,
  lastName: String,
  staffId: String (unique),
  department: String,
  position: String,
  phone: String,
  email: String,
  hospitalName: String,
  address: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Blood Requests Collection
```javascript
{
  _id: ObjectId,
  requesterId: String,
  requesterName: String,
  hospitalName: String,
  bloodType: String,
  quantity: Number,
  urgency: String,
  reason: String,
  status: String,
  createdAt: Date,
  updatedAt: Date,
  // Extended fields
  patientName: String,
  hospitalAddress: String,
  contactNumber: String,
  purpose: String,
  operationType: String,
  requiredWithin: String,
  remarks: String
}
```

## Navigation Flow

### Updated Navbar
- For hospital staff users:
  - Show "Blood Dashboard" button
  - Link points to `/hospital-dashboard`
  - Replaces generic "Dashboard" link

```typescript
{user.role === "hospital" && (
  <Link href="/hospital-dashboard">
    <Button size="sm" className="bg-primary hover:bg-primary/90">
      Blood Dashboard
    </Button>
  </Link>
)}
```

### Route Structure
```
/                      → Landing Page
/login                 → Login Page (all users)
/register              → Donor Registration
/staff-register        → Hospital Staff Registration
/verify-email          → Email Verification
/dashboard             → Generic User Dashboard
/hospital-dashboard    → Hospital Staff Dashboard (hospital role only)
/about                 → About Page
/contact               → Contact Page
```

## Authentication Context Updates

### User Object Structure
```typescript
interface User {
  id: string;           // User ID from database
  username: string;     // Login username
  email: string;        // User email
  role: string;         // "hospital", "donor", "admin", "receiver"
  emailVerified: boolean; // Email verification status
  name: string;         // Display name (username or full name)
}
```

### Role-Based Access Control
```typescript
// In components/layout/Navbar.tsx
if (user.role === "hospital") {
  // Show Blood Dashboard link
} else if (user.role === "donor") {
  // Show Donation History link
} else if (user.role === "admin") {
  // Show Admin Dashboard link
}
```

## Session Management

### Session Storage
```typescript
// After registration
sessionStorage.setItem(
  "lifeflow:pendingVerification",
  JSON.stringify({
    userId: "507f1f77bcf86cd799439011",
    email: "john.doe@hospital.com"
  })
);

// After verification
sessionStorage.removeItem("lifeflow:pendingVerification");
```

### LocalStorage (Optional)
```typescript
// Store user preferences
localStorage.setItem(
  "lifeflow:userPreferences",
  JSON.stringify({
    defaultFilter: "active",
    itemsPerPage: 10,
    theme: "light"
  })
);
```

## Error Handling

### Registration Errors
| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Missing fields | Fill all required fields |
| 409 Conflict | Duplicate email/username | Use unique email/username |
| 422 Unprocessable | Validation failed | Check password strength, email format |
| 500 Server Error | Server issue | Retry or contact support |

### Verification Errors
| Error | Cause | Solution |
|-------|-------|----------|
| 404 Not Found | Invalid user ID | Register again |
| 400 Bad Request | Invalid code | Enter correct 6-digit code |
| 410 Gone | Code expired | Request resend |
| 500 Server Error | Server issue | Retry or contact support |

### Dashboard Errors
| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Not authenticated | Login again |
| 403 Forbidden | Wrong role | Register as hospital staff |
| 404 Not Found | Resource missing | Check data exists |
| 500 Server Error | Server issue | Retry or contact support |

## Testing Checklist

### Registration Form
- [ ] All 10 form fields accept input
- [ ] Validation works for each field
- [ ] Error messages display correctly
- [ ] Username availability check works
- [ ] Email uniqueness check works
- [ ] Password strength validation works
- [ ] Confirm password matching works
- [ ] Form submission succeeds with valid data
- [ ] Form submission fails with invalid data

### Email Verification
- [ ] Verification code sent to email
- [ ] 6-digit code input accepted
- [ ] Invalid codes rejected
- [ ] Valid code verified successfully
- [ ] Redirect to dashboard after verification
- [ ] Role-based redirect works (hospital → /hospital-dashboard)
- [ ] Session storage cleared after verification
- [ ] Resend code functionality works
- [ ] Code expiration works

### Dashboard Access
- [ ] Non-authenticated users redirected to login
- [ ] Non-hospital users see access denied
- [ ] Hospital staff see full dashboard
- [ ] Staff profile displays correctly
- [ ] Blood requests load successfully
- [ ] Filtering works for status and urgency
- [ ] View Details modal opens and displays data
- [ ] Modal close button works
- [ ] Responsive design works on all devices

### Navigation
- [ ] Navbar shows "Blood Dashboard" for hospital staff
- [ ] Navbar shows "Dashboard" for other users
- [ ] Links navigate to correct pages
- [ ] Logout clears user session
- [ ] Logout redirects to login page

## Deployment Checklist

- [ ] Environment variables configured
  - `MONGO_URI` - MongoDB connection string
  - `JWT_SECRET` - JWT signing secret
  - `EMAIL_SERVICE` - Email service provider
  - `EMAIL_FROM` - Sender email address
  - `API_URL` - Backend API URL

- [ ] Database ready
  - Collections created: users, staff, bloodrequests
  - Indexes created for performance
  - Schema migration completed

- [ ] API endpoints working
  - POST /api/register
  - POST /api/staff
  - POST /api/verify-email
  - POST /api/resend-verification
  - GET /api/blood-requests
  - GET /api/profile/:userId/:role

- [ ] Frontend components deployed
  - StaffRegisterPage.tsx
  - VerifyEmailPage.tsx (updated)
  - HospitalStaffDashboard.tsx
  - App.tsx (routes updated)
  - Navbar.tsx (updated)

- [ ] Email service configured
  - SMTP credentials
  - Email templates
  - Sender verification

- [ ] SSL/TLS certificates installed
- [ ] CORS configured
- [ ] Rate limiting configured
- [ ] Logging enabled
- [ ] Error monitoring enabled

## Performance Optimization

### Frontend Optimization
- Lazy load Hospital Staff Dashboard component
- Memoize blood requests table rows
- Use React.memo for child components
- Implement virtual scrolling for large lists

### Backend Optimization
- Add indexes to frequently queried fields
- Implement pagination for blood requests
- Cache staff profile data
- Use database connection pooling

### Database Optimization
```javascript
// Create indexes
db.users.createIndex({ email: 1 });
db.users.createIndex({ username: 1 });
db.staff.createIndex({ userId: 1 });
db.staff.createIndex({ staffId: 1 });
db.bloodrequests.createIndex({ urgency: 1, status: 1 });
db.bloodrequests.createIndex({ createdAt: -1 });
db.bloodrequests.createIndex({ hospitalName: 1 });
```

## Maintenance & Support

### Regular Tasks
- Monitor registration completion rates
- Check email delivery success rates
- Monitor dashboard performance
- Review error logs weekly
- Update security patches

### Troubleshooting Guide
See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready
