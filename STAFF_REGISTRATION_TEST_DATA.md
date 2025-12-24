# Staff Registration - Test Data & Examples

## 📋 Valid Registration Examples

### Example 1: Doctor Registration
```
Full Name: Dr. Sarah Johnson
Staff ID: DOC2024001
Gender: Female
Contact Number: +1-555-123-4567
Email: sarah.johnson@hospital.com
Residential Address: 456 Medical Plaza, Suite 500
                     Healthcare City, CA 90210
Username: drsarah_med
Designation: Doctor
Password: SecurePassword123!
Confirm Password: SecurePassword123!
```
**Expected Result:** ✅ Registration successful

---

### Example 2: Nurse Registration
```
Full Name: Michael Chen
Staff ID: NRS2024045
Gender: Male
Contact Number: (555) 234-5678
Email: michael.chen@hospital.net
Residential Address: 789 Wellness Drive
                     Health Valley, TX 75001
Username: mchen_nurse
Designation: Nurse
Password: MySecurePass456
Confirm Password: MySecurePass456
```
**Expected Result:** ✅ Registration successful

---

### Example 3: Technician Registration
```
Full Name: Emma Rodriguez
Staff ID: TECH2024089
Gender: Female
Contact Number: 555-345-6789
Email: emma.rodriguez@hospital.org
Residential Address: 321 Laboratory Lane, Apt 102
                     Science City, NY 10001
Username: erodriguez_tech
Designation: Technician
Password: TechPass789#
Confirm Password: TechPass789#
```
**Expected Result:** ✅ Registration successful

---

### Example 4: Receptionist Registration
```
Full Name: James Williams
Staff ID: REC2024012
Gender: Male
Contact Number: 5554567890
Email: james.williams@hospital.com
Residential Address: 654 Administration Drive
                     Downtown, FL 33101
Username: jwilliams_rec
Designation: Receptionist
Password: RecPass123456
Confirm Password: RecPass123456
```
**Expected Result:** ✅ Registration successful

---

## ❌ Invalid Registration Examples

### Example 1: Missing Full Name
```
Full Name: [EMPTY]
Staff ID: EMP001
Gender: Male
Contact Number: +1-555-123-4567
Email: user@hospital.com
Residential Address: 123 Main St
Username: username123
Designation: Doctor
Password: Password123
Confirm Password: Password123
```
**Expected Result:** ❌ Error: "Full Name is required"

---

### Example 2: Invalid Email Format
```
Full Name: John Doe
Staff ID: EMP001
Gender: Male
Contact Number: +1-555-123-4567
Email: john.doe@invalid
Residential Address: 123 Main St
Username: username123
Designation: Doctor
Password: Password123
Confirm Password: Password123
```
**Expected Result:** ❌ Error: "Please enter a valid email address"

---

### Example 3: Invalid Contact Number
```
Full Name: John Doe
Staff ID: EMP001
Gender: Male
Contact Number: 123
Email: john@hospital.com
Residential Address: 123 Main St
Username: username123
Designation: Doctor
Password: Password123
Confirm Password: Password123
```
**Expected Result:** ❌ Error: "Please enter a valid contact number (10-15 digits)"

---

### Example 4: Password Too Short
```
Full Name: John Doe
Staff ID: EMP001
Gender: Male
Contact Number: +1-555-123-4567
Email: john@hospital.com
Residential Address: 123 Main St
Username: username123
Designation: Doctor
Password: Pass
Confirm Password: Pass
```
**Expected Result:** ❌ Error: "Password must be at least 6 characters"

---

### Example 5: Passwords Don't Match
```
Full Name: John Doe
Staff ID: EMP001
Gender: Male
Contact Number: +1-555-123-4567
Email: john@hospital.com
Residential Address: 123 Main St
Username: username123
Designation: Doctor
Password: Password123
Confirm Password: DifferentPassword456
```
**Expected Result:** ❌ Error: "Passwords do not match"

---

### Example 6: Username Too Short
```
Full Name: John Doe
Staff ID: EMP001
Gender: Male
Contact Number: +1-555-123-4567
Email: john@hospital.com
Residential Address: 123 Main St
Username: ab
Designation: Doctor
Password: Password123
Confirm Password: Password123
```
**Expected Result:** ❌ Error: "Username must be at least 3 characters"

---

### Example 7: Duplicate Username
Register first time:
```
Username: johndoe123
Email: john@hospital.com
```

Try to register second time with same username:
```
Username: johndoe123
Email: different@hospital.com
```

**Expected Result:** ❌ Error Toast: "Username already exists"

---

### Example 8: Duplicate Email
Register first time:
```
Username: john123
Email: john@hospital.com
```

Try to register second time with same email:
```
Username: john456
Email: john@hospital.com
```

**Expected Result:** ❌ Error Toast: "Email already in use"

---

## 📱 Contact Number Formats (Valid)

These contact number formats should all be accepted:
```
+1-555-123-4567          ✅
555-123-4567             ✅
(555) 123-4567           ✅
5551234567               ✅
+1 555 123 4567          ✅
001-555-123-4567         ✅
```

Invalid contact numbers:
```
123                      ❌ (too short)
12345678901234567        ❌ (too long - over 15 digits)
abcdefghij               ❌ (not numbers)
```

---

## 📧 Email Format (Valid)

These email formats should be accepted:
```
user@hospital.com        ✅
john.doe@hospital.com    ✅
staff+1@hospital.org     ✅
user123@subdomain.hospital.co.uk  ✅
```

Invalid emails:
```
user@invalid             ❌ (missing TLD)
@hospital.com            ❌ (missing local part)
user @hospital.com       ❌ (space in local part)
user@.com                ❌ (missing domain)
```

---

## 🔐 Password Strength Examples

### Weak Passwords (but technically valid - 6+ chars)
```
123456               ⚠️ Valid but weak
password             ⚠️ Valid but weak
aaaaaa               ⚠️ Valid but weak
```

### Strong Passwords (6+ chars)
```
SecurePass123        ✅ Mix of cases and numbers
MyHosp@123          ✅ With special character
Pass_Word_2024      ✅ With underscore
Complex#Pass456     ✅ Strong combination
```

---

## 👥 Staff ID Examples

Valid Staff ID formats:
```
EMP2024001           ✅
STAFF-2024-045       ✅
DOC001               ✅
NRS-45-A             ✅
TECH_2024_089        ✅
12345                ✅
ABC123XYZ            ✅
```

---

## 🎯 Designation Options

Available roles in dropdown:
```
1. Doctor            👨‍⚕️
2. Nurse             👩‍⚕️
3. Technician        🔧
4. Receptionist      📞
```

---

## 📄 Address Examples

Valid residential addresses:
```
123 Hospital Lane, Suite 200, New York, NY 10001

456 Medical Plaza
Healthcare District
Los Angeles, CA 90210

789 Wellness Drive
Apartment 5B
Chicago, IL 60601

321 Doctor's Avenue
Medical Center Tower
Suite 1500
Houston, TX 77001
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete Valid Registration
1. Fill all fields with valid data
2. Submit form
3. See success message
4. Redirect to email verification
5. ✅ **Pass**

---

### Scenario 2: Field-by-Field Validation
1. Leave Full Name empty, other fields valid → Error shows
2. Clear Full Name, error disappears
3. Leave Staff ID empty → Error shows
4. Continue for each field
5. ✅ **Pass** when all validations work independently

---

### Scenario 3: Real-time Error Clearing
1. Fill Full Name with empty value → Error shows
2. Start typing in Full Name → Error disappears immediately
3. Same for other fields
4. ✅ **Pass** when all errors clear as user types

---

### Scenario 4: Password Visibility Toggle
1. Enter password, see dots
2. Click eye icon → Password visible as text
3. Click eye icon again → Password hidden as dots
4. Same for Confirm Password
5. ✅ **Pass** when toggle works smoothly

---

### Scenario 5: Reset Form
1. Fill all fields with data
2. Click Reset button
3. All fields become empty
4. No error messages visible
5. ✅ **Pass** when form is completely cleared

---

### Scenario 6: Gender Selection
1. Click "Male" radio button → Selected
2. Click "Female" → Female selected, Male unselected
3. Click "Other" → Other selected, Female unselected
4. ✅ **Pass** when only one can be selected

---

### Scenario 7: Designation Selection
1. Click Designation dropdown
2. See all 4 options
3. Select "Nurse"
4. Value shows "Nurse"
5. Select "Doctor"
6. Value shows "Doctor"
7. ✅ **Pass** when dropdown works correctly

---

### Scenario 8: Mobile Responsiveness
1. Reduce browser to mobile size (<768px)
2. Form fields should show in 1 column
3. All text readable
4. Buttons full width
5. No horizontal scrolling
6. ✅ **Pass** when mobile layout is clean

---

### Scenario 9: Successful Registration & Redirect
1. Fill valid data
2. Click Register
3. Button shows "Registering..."
4. Success toast appears
5. Redirected to /verify-email
6. Email verification page loads
7. ✅ **Pass** when flow completes

---

### Scenario 10: Navigation Links
1. From registration page, click "Login" link
2. Should go to /login page
3. From login page, click "Register here" (Hospital Staff)
4. Should go to /staff-register page
5. ✅ **Pass** when all links work

---

## 📊 Data Validation Summary

| Field | Min | Max | Format | Required |
|-------|-----|-----|--------|----------|
| Full Name | 1 char | 100 chars | Text | Yes |
| Staff ID | 1 char | 50 chars | Text | Yes |
| Gender | - | - | Male/Female/Other | Yes |
| Contact | 10 digits | 15 digits | Numbers | Yes |
| Email | - | 100 chars | valid@email.com | Yes |
| Address | 1 char | 500 chars | Text | Yes |
| Username | 3 chars | 50 chars | Alphanumeric | Yes |
| Designation | - | - | Doctor/Nurse/Tech/Rec | Yes |
| Password | 6 chars | 100 chars | Any character | Yes |
| Confirm Pass | 6 chars | 100 chars | Must match | Yes |

---

## 🚀 Performance Tests

Test registration on different conditions:

### Test 1: Network Speed
- Fast connection: Should complete in <2 seconds
- Slow connection: Should show loading state properly

### Test 2: API Response
- Success response: Redirect immediately
- Error response: Show error message clearly

### Test 3: Form Size
- All fields visible without excessive scrolling
- Submit button always accessible

---

## ♿ Accessibility Tests

Test with:
- **Keyboard navigation:** Tab through all fields
- **Screen reader:** All labels and errors announced
- **Color contrast:** Text readable on background
- **Focus indicators:** Clear focus ring on inputs

---

## 🎓 Learning Test Scenarios

Use these examples to:
1. Understand validation flow
2. Test error handling
3. Practice form filling
4. Verify responsive design
5. Test API integration
6. Check user feedback messages

---

## 💾 Test Data Backup

Save successful registration data:
```json
{
  "fullName": "Dr. Sarah Johnson",
  "staffId": "DOC2024001",
  "gender": "female",
  "contactNumber": "+1-555-123-4567",
  "email": "sarah.johnson@hospital.com",
  "address": "456 Medical Plaza, Suite 500, Healthcare City, CA 90210",
  "username": "drsarah_med",
  "designation": "doctor",
  "registeredAt": "2024-01-15T10:30:00Z",
  "verificationStatus": "pending"
}
```

---

## ✅ Checklist for Complete Testing

- [ ] All valid examples register successfully
- [ ] All invalid examples show correct errors
- [ ] Email format validation works
- [ ] Contact validation works
- [ ] Password matching works
- [ ] Username availability checks work
- [ ] Gender radio buttons work
- [ ] Designation dropdown works
- [ ] Password visibility toggle works
- [ ] Reset button clears form
- [ ] Form is mobile responsive
- [ ] Success message appears
- [ ] Redirect to email verification works
- [ ] Navigation links work
- [ ] No console errors
- [ ] Loading state shows during submission
- [ ] Error messages are clear
- [ ] Touch-friendly on mobile
- [ ] Fast form submission
- [ ] Accessibility features work

You're ready to test! 🎉
