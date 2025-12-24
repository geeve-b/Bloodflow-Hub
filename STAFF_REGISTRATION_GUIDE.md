# Staff Registration Page - Integration Guide

## Overview
A professional staff registration page has been created at `/staff-register` that allows hospital staff to create accounts. The page integrates seamlessly with the existing authentication system.

## Features Implemented

### 1. Form Fields
- **Full Name** - Text input with user icon
- **Staff ID / Employee ID** - Unique identifier field
- **Gender** - Radio buttons (Male, Female, Other)
- **Contact Number (Primary)** - Phone number field with validation
- **Email Address** - Email field with format validation
- **Residential Address** - Multi-line textarea
- **Username** - Unique username field (min 3 characters)
- **Designation / Role** - Dropdown with options:
  - Doctor
  - Nurse
  - Technician
  - Receptionist
- **Password** - Password field with visibility toggle
- **Confirm Password** - Password field with visibility toggle

### 2. Validation Rules
✓ All fields are required
✓ Email format validation (RFC 5322 compliant)
✓ Contact number validation (10-15 digits)
✓ Username minimum 3 characters
✓ Password minimum 6 characters
✓ Password and Confirm Password must match
✓ Real-time error clearing as user types

### 3. UI/UX Features
- Professional hospital dashboard design
- Clean, modern typography
- Rounded input fields (lg radius)
- Icons for each input field:
  - 👤 User icon for Full Name
  - 📞 Phone icon for Contact
  - ✉️ Mail icon for Email
  - 🏠 Home icon for Address
  - 💼 Briefcase icon for Designation
  - 🔒 Lock icon for Password
- Responsive grid layout (1 col on mobile, 2 cols on desktop)
- Password visibility toggle with eye icon
- Gradient background
- Shadow and border styling for professional look
- Mobile-friendly layout

### 4. Form Actions
- **Register Button** - Primary button to submit form
- **Reset Button** - Clears all fields and errors
- **Login Link** - Link to login page for existing users

### 5. Validation Messages
- Clear, user-friendly error messages
- Red text color for errors
- Errors appear inline below fields
- Errors clear automatically when user starts typing

### 6. Integration with Login Page
The Hospital Staff tab on the login page now has two links:
1. "Sign In as Staff" - For existing staff to login
2. "Register here" - Links to `/staff-register` for new staff registration

## File Changes

### New Files Created
- `client/src/pages/StaffRegisterPage.tsx` - Main staff registration page

### Modified Files
1. **App.tsx**
   - Added import for StaffRegisterPage
   - Added route: `<Route path="/staff-register" component={StaffRegisterPage} />`

2. **LoginPage.tsx**
   - Updated CardFooter with improved layout
   - Added separate "Register as Donor" link
   - Added "Register here" link for Hospital Staff registration

## Flow Diagram

```
User visits /login
    ↓
Selects "Hospital Staff" tab
    ↓
Option 1: "Sign In as Staff" (existing user)
    OR
Option 2: "Register here" (new staff)
    ↓
Redirected to /staff-register
    ↓
Fills form with required information
    ↓
Validates all fields
    ↓
Submits registration
    ↓
Backend creates User account (role: "hospital")
    ↓
Backend creates Staff profile linked to User
    ↓
Redirects to /verify-email
    ↓
Staff verifies email
    ↓
Can now login as hospital staff
```

## API Endpoints Used

### 1. Register User Account
```
POST /api/register
Body: {
  username: string,
  password: string,
  email: string,
  role: "hospital"
}
```

### 2. Create Staff Profile
```
POST /api/staff
Body: {
  userId: string,
  firstName: string,
  lastName: string,
  staffId: string,
  department: string,
  position: string,
  phone: string,
  email: string,
  hospitalName: string
}
```

## Form Data Flow

```
StaffRegisterPage Form Input
    ↓
Local State Management
    ↓
Validation on Submit
    ↓
API Call to /api/register
    ↓
Create User Account
    ↓
Extract userId from response
    ↓
API Call to /api/staff
    ↓
Create Staff Profile
    ↓
Success Toast Notification
    ↓
Redirect to Email Verification
    ↓
Store pending verification in sessionStorage
```

## Usage

### For New Staff Members:
1. Navigate to `/login`
2. Click on "Hospital Staff" tab
3. Click "Register here" link
4. Fill in all required fields
5. Click "Register" button
6. Verify email
7. Login with username and password

### For Existing Users:
1. Navigate to `/login`
2. Click on "Hospital Staff" tab
3. Enter username and password
4. Click "Sign In as Staff"

## Styling

The page uses the existing Tailwind CSS configuration with:
- Primary color for icons and links
- Destructive color for validation errors
- Muted background for subtle visual separation
- Gradient backgrounds for modern look
- Rounded corners (lg) for input fields
- Responsive grid system
- Proper spacing and typography hierarchy

## Error Handling

- Network errors are caught and displayed as toast notifications
- Validation errors are shown inline with red text
- Duplicate username/email errors from backend are displayed
- Registration failures provide clear error messages
- Password mismatch is clearly indicated

## Security Features

- Passwords are hashed on the backend (bcrypt)
- Email verification required before login
- Validation on both frontend and backend
- Secure password input with visibility toggle
- Password confirmation field prevents typos
- Session storage for pending verification data

## Future Enhancements

- Hospital selection/assignment
- Department/unit selection
- Additional staff role permissions
- Staff photo upload
- Badge/certificate verification
- Manager/supervisor assignment
- Working hours/shift management
