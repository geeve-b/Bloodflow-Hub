# Staff Registration Page - Testing Guide

## Quick Start

### To Access the Staff Registration Page:
1. Go to `http://localhost:3000/login` (or your app URL)
2. Click on the "Hospital Staff" tab
3. Click "Register here" link
4. Fill in the form and submit

### Or Direct Link:
Navigate directly to `http://localhost:3000/staff-register`

## Test Cases

### ✅ Successful Registration

**Test Data:**
```
Full Name: Dr. Sarah Johnson
Staff ID: EMP2024001
Gender: Female
Contact Number: +1-555-123-4567
Email: sarah.johnson@hospital.com
Residential Address: 123 Medical Drive, Suite 200, Healthcare City, CA 90001
Username: drsarah_med
Designation: Doctor
Password: SecurePass123
Confirm Password: SecurePass123
```

**Expected Result:**
- Form validates successfully
- No error messages shown
- Success toast: "Staff registration successful! Please verify your email to login."
- Redirects to `/verify-email` page
- User can verify email and login

---

### ❌ Validation Test Cases

#### 1. **Missing Required Fields**
Leave any field empty and click "Register"

**Expected Result:**
- Error message: "Full Name is required" (or appropriate field)
- Form does not submit
- Error message appears in red below the field

---

#### 2. **Invalid Email Format**
```
Email: invalidemail@
```

**Expected Result:**
- Error message: "Please enter a valid email address"
- Red highlight on email field

---

#### 3. **Invalid Contact Number**
```
Contact Number: 12345
```

**Expected Result:**
- Error message: "Please enter a valid contact number (10-15 digits)"

---

#### 4. **Password Too Short**
```
Password: 12345
Confirm Password: 12345
```

**Expected Result:**
- Error message: "Password must be at least 6 characters"

---

#### 5. **Passwords Don't Match**
```
Password: SecurePass123
Confirm Password: DifferentPass456
```

**Expected Result:**
- Error message: "Passwords do not match"
- Red highlight on Confirm Password field

---

#### 6. **Username Too Short**
```
Username: ab
```

**Expected Result:**
- Error message: "Username must be at least 3 characters"

---

#### 7. **Duplicate Username**
Register once, then try to register again with same username

**Expected Result:**
- Error toast: "Username already exists"
- User stays on registration page

---

#### 8. **Duplicate Email**
Register once, then try to register again with same email

**Expected Result:**
- Error toast: "Email already in use"
- User stays on registration page

---

### 🔄 Form Behavior Tests

#### 1. **Password Visibility Toggle**
- Click eye icon next to password field
- **Expected:** Password shows as plain text
- Click again
- **Expected:** Password shows as dots

---

#### 2. **Reset Button**
- Fill in all fields
- Click "Reset" button
- **Expected:** All fields are cleared, no error messages shown

---

#### 3. **Real-time Error Clearing**
- Fill Full Name with invalid data to trigger error
- Start typing in the field
- **Expected:** Error message disappears instantly

---

#### 4. **Select Designation Dropdown**
- Click the "Designation / Role" dropdown
- **Expected:** Shows options:
  - Doctor
  - Nurse
  - Technician
  - Receptionist

---

#### 5. **Gender Radio Buttons**
- Click each gender option (Male, Female, Other)
- **Expected:** Only one can be selected at a time

---

### 📱 Responsive Design Tests

#### Desktop View (1200px+)
- Form fields should display in 2-column grid
- Layout should be clean and organized
- All icons should be visible

#### Tablet View (768px - 1024px)
- Form fields should still display in 2-column grid
- Buttons should stack properly

#### Mobile View (<768px)
- Form fields should display in 1-column layout
- Buttons should be full width
- All content should be readable
- No horizontal scrolling

---

### 🎨 UI/UX Tests

#### Visual Elements:
- [ ] Card has shadow effect
- [ ] Input fields have rounded corners (lg)
- [ ] Icons appear next to labels
- [ ] Error messages are in red
- [ ] Register button is primary color
- [ ] Reset button is outline style
- [ ] Gradient background visible
- [ ] Mobile view is clean and readable

#### Interactivity:
- [ ] Buttons are disabled while loading
- [ ] "Register..." text shows during submission
- [ ] Toast notifications appear/disappear
- [ ] Links are clickable
- [ ] Form is keyboard navigable

---

### 🔐 Security Tests

#### Password Field Security:
- [ ] Password input is masked by default
- [ ] Confirm password is masked by default
- [ ] Toggle shows password securely
- [ ] Password matches validation works

#### Email Verification:
- [ ] After successful registration, redirects to verify email
- [ ] Email sent to provided address
- [ ] User must verify before login

---

## Test Login Credentials

After successful staff registration, login with:

```
Page: /login
Tab: Hospital Staff

Username: [whatever you entered in registration]
Password: [whatever you entered in registration]
```

---

## Browser Compatibility

Test on:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance Tests

- [ ] Page loads quickly
- [ ] Form submission doesn't lag
- [ ] Validation happens instantly
- [ ] Toast notifications appear smoothly
- [ ] No console errors

---

## Accessibility Tests

- [ ] All form labels are properly associated with inputs
- [ ] Can navigate with Tab key
- [ ] Error messages are announced
- [ ] Icons have proper contrast
- [ ] Text is readable (sufficient size and contrast)
- [ ] Form can be submitted with Enter key

---

## Notes

- The form uses real API endpoints (`/api/register` and `/api/staff`)
- Email verification is required before login
- All data is validated on both frontend and backend
- Session storage is used for pending verification tracking
- Toast notifications provide user feedback for all actions
