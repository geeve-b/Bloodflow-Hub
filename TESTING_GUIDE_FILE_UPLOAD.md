# Staff ID File Upload Feature - Testing Guide

## Quick Start

### Prerequisites
1. Node.js v22.20.0 or later
2. MongoDB running locally or via connection string
3. Application dependencies installed

### Installation Steps
```bash
# 1. Install new dependencies
npm install

# 2. Start development server
npm run dev

# 3. In another terminal, start client
npm run dev:client
```

## Test Scenarios

### Test 1: Valid PDF Upload
**Steps:**
1. Navigate to Staff Registration page
2. Fill all required fields:
   - Full Name: "John Doe"
   - Staff ID: "EMP001"
   - Gender: "Male"
   - Contact Number: "9876543210"
   - Email: "john@hospital.com"
   - Address: "123 Hospital Lane"
   - Username: "johndoe"
   - Designation: "Doctor"
   - Password: "password123"
   - Confirm Password: "password123"
3. Click upload area and select a valid PDF file (< 5MB)
4. Verify file preview shows:
   - Red FileText icon
   - File name
   - File size in KB
5. Click "Register" button
6. Expected: Success message, redirect to email verification

**Verify:**
- ✅ File appears in `/uploads/staff_documents/` directory
- ✅ Staff record created in database with `staff_id_document` field populated
- ✅ File accessible at `/uploads/staff_documents/{filename}`

---

### Test 2: Valid Image Upload (JPG)
**Steps:**
1. Navigate to Staff Registration page
2. Fill all required fields (same as Test 1)
3. Upload a valid JPG/JPEG image (< 5MB)
4. Verify file preview shows:
   - Gray "IMG" placeholder box
   - File name
   - File size in KB
5. Click "Register" button

**Verify:**
- ✅ File appears in `/uploads/staff_documents/`
- ✅ Staff record created with file path
- ✅ Image accessible via browser

---

### Test 3: Valid Image Upload (PNG)
**Steps:**
1. Repeat Test 2 with a PNG file instead of JPG

**Verify:**
- ✅ Same as Test 2

---

### Test 4: Invalid File Format
**Steps:**
1. Navigate to Staff Registration page
2. Try to upload an invalid file type (e.g., .txt, .docx, .exe)
3. Observe file input behavior

**Expected Result:**
- ❌ File is rejected (browser's accept attribute prevents selection)
- If somehow selected: Error message "Invalid file format. Allowed formats: PDF, JPG, JPEG, PNG"
- File preview doesn't appear
- File state remains null

---

### Test 5: File Size Exceeded
**Steps:**
1. Navigate to Staff Registration page
2. Create/locate a file > 5MB
3. Try to upload the large file
4. Observe error display

**Expected Result:**
- ❌ Error message appears: "File size exceeds 5 MB limit. Current size: X.XX MB"
- File preview doesn't appear
- File state remains null

---

### Test 6: Remove Selected File
**Steps:**
1. Upload a valid file (see Test 1 or 2)
2. Verify file preview appears
3. Click the X (remove) button on the preview
4. Verify preview disappears

**Expected Result:**
- ✅ File preview removed
- ✅ File error cleared
- ✅ File state reset to null
- ✅ Can upload a new file after removal

---

### Test 7: Missing File Upload
**Steps:**
1. Navigate to Staff Registration page
2. Fill all required fields
3. **DO NOT** upload a file
4. Click "Register" button
5. Observe validation error

**Expected Result:**
- ❌ Form submission prevented
- Error message: "Validation Error - Please fix the errors in the form"
- Visual indication: Red error text "Staff ID proof document is required"

---

### Test 8: Form Submission Without File When Required
**Steps:**
1. Fill all form fields except file
2. Try to click Register
3. Check toast notification

**Expected Result:**
- ❌ Toast shows "Validation Error"
- ✅ File error displays on page

---

### Test 9: Successful End-to-End Registration
**Steps:**
1. Complete all Test 1 requirements
2. Submit form successfully
3. Verify email sent
4. Open browser DevTools (F12) → Network tab
5. Check the POST /api/staff request

**Verify in DevTools:**
- ✅ Request Content-Type is `multipart/form-data`
- ✅ Form data includes: userId, firstName, lastName, staffId, etc.
- ✅ File is included in FormData
- ✅ Response 201 status with staff record
- ✅ Response includes `staff_id_document` field with path

---

### Test 10: Database Field Verification
**Steps:**
1. Complete a successful registration with file upload
2. Query MongoDB directly
3. Find the staff record in the "staff" collection

**MongoDB Query:**
```javascript
db.staff.findOne({staffId: "EMP001"})
```

**Expected Output:**
```json
{
  "_id": ObjectId("..."),
  "userId": "...",
  "firstName": "John",
  "lastName": "Doe",
  "staffId": "EMP001",
  "department": "General",
  "position": "Doctor",
  "phone": "9876543210",
  "email": "john@hospital.com",
  "hospitalName": "Your Hospital",
  "staff_id_document": "/uploads/staff_documents/1699564800000-123456789.pdf",
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

---

### Test 11: File Access via HTTP
**Steps:**
1. Complete a successful file upload
2. Get the `staff_id_document` path from database (e.g., `/uploads/staff_documents/1699564800000-123456789.pdf`)
3. Open browser and navigate to: `http://localhost:3001/uploads/staff_documents/1699564800000-123456789.pdf`

**Expected Result:**
- ✅ File downloads/displays in browser
- ✅ Correct file content displayed
- ✅ No 404 error

---

### Test 12: Error Recovery - Failed Upload Cleanup
**Steps:**
1. Set up a test to force database error (optional, requires modification)
2. Upload valid file with invalid staff data
3. Verify file is cleaned up

**Expected Result:**
- ❌ Error message displayed
- ✅ Temporary file removed from `/uploads/staff_documents/`
- Database record not created

---

### Test 13: Multiple File Upload Attempts
**Steps:**
1. Upload File 1 (valid) - keep selected
2. Click Remove button
3. Upload File 2 (different valid file)
4. Submit form

**Expected Result:**
- ✅ Only File 2 is uploaded
- ✅ File 2 appears in database
- ✅ Successfully registered

---

### Test 14: Drag and Drop (Optional)
**Steps:**
1. Navigate to Staff Registration page
2. Prepare a valid file
3. Drag file onto upload area
4. Drop file

**Expected Result:**
- ✅ File selected via drag and drop
- ✅ File preview appears
- ✅ Can submit form with this file

---

## Validation Tests

### Validation Test 1: Client-Side File Type Check
**Expected Behavior:**
- JPG, JPEG, PNG, PDF accepted
- All other formats rejected immediately
- Error shows specific format requirements

---

### Validation Test 2: Client-Side Size Check
**Expected Behavior:**
- Files ≤ 5MB accepted
- Files > 5MB rejected immediately
- Error shows actual file size vs limit

---

### Validation Test 3: Server-Side MIME Type Validation
**Expected Behavior:**
- Server verifies MIME type even if client bypassed check
- Invalid MIME types rejected
- Error: "Invalid file type. Only PDF, JPG, JPEG, PNG are allowed"

---

### Validation Test 4: Server-Side Size Validation
**Expected Behavior:**
- Server enforces 5MB limit via multer
- Oversized files rejected
- Error: "File too large"

---

## UI/UX Tests

### UI Test 1: Upload Area Interactivity
**Steps:**
1. Hover over upload area
2. Verify visual feedback

**Expected:**
- ✅ Border changes to primary color
- ✅ Background has subtle color change
- ✅ Cursor changes to pointer

---

### UI Test 2: Error Message Display
**Steps:**
1. Trigger each error condition:
   - Missing file
   - Invalid format
   - File too large
2. Verify error message appearance

**Expected:**
- ✅ Clear, readable error text
- ✅ Red color for destructive/error state
- ✅ Message contextually relevant

---

### UI Test 3: File Preview Information
**Steps:**
1. Upload valid file
2. Check preview displays correctly

**Expected for PDF:**
- ✅ Red FileText icon
- ✅ Filename displayed
- ✅ File size in KB

**Expected for Image:**
- ✅ Gray IMG placeholder
- ✅ Filename displayed
- ✅ File size in KB

---

### UI Test 4: Form Layout Responsiveness
**Steps:**
1. Test on desktop (1920x1080)
2. Test on tablet (768px)
3. Test on mobile (375px)

**Expected:**
- ✅ Upload area readable on all sizes
- ✅ Labels and inputs properly aligned
- ✅ Error messages visible
- ✅ File preview formatted correctly

---

## Performance Tests

### Performance Test 1: Large File Handling (Near Limit)
**Steps:**
1. Create 4.9MB file
2. Upload to registration
3. Measure response time

**Expected:**
- ✅ Upload succeeds within reasonable time
- ✅ No UI freeze during upload
- ✅ File saved to disk successfully

---

### Performance Test 2: Multiple Files Sequentially
**Steps:**
1. Register 3 staff members with different files
2. Verify all files unique and accessible

**Expected:**
- ✅ All files with unique names
- ✅ No overwrites
- ✅ All accessible

---

## Security Tests

### Security Test 1: File Type Spoofing
**Steps:**
1. Rename .exe to .pdf
2. Try to upload

**Expected:**
- ❌ Rejected by MIME type check
- Server-side validation prevents bypass

---

### Security Test 2: Malicious Filename
**Steps:**
1. Try uploading file with special characters in name
2. Verify stored filename

**Expected:**
- ✅ Filename sanitized
- ✅ Stored with timestamp + random suffix
- ✅ Original dangerous characters removed

---

### Security Test 3: Path Traversal Attempt
**Steps:**
1. File upload occurs to designated directory only

**Expected:**
- ✅ All files in `/uploads/staff_documents/`
- ✅ No files outside designated directory
- ✅ No directory traversal possible

---

## Browser Compatibility

Test in:
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

Expected: File upload works consistently across all modern browsers.

---

## Common Issues & Solutions

### Issue 1: "EACCES: permission denied"
**Solution:**
```bash
# Check directory permissions
ls -la uploads/

# Fix permissions if needed
chmod 755 uploads/staff_documents/
```

### Issue 2: Files not appearing in directory
**Check:**
- Multer is installed: `npm ls multer`
- Directory created: `ls uploads/staff_documents/`
- File size within limit

### Issue 3: 502 Bad Gateway
**Solution:**
- Restart server: `npm run dev`
- Check multer middleware configuration
- Verify no port conflicts

### Issue 4: "Cannot find module 'multer'"
**Solution:**
```bash
npm install --save multer
npm install --save-dev @types/multer
```

---

## Success Criteria Checklist

- [ ] All file type validations working
- [ ] Size limit enforced on client and server
- [ ] Files accessible after upload
- [ ] Database records created with file paths
- [ ] Error messages clear and helpful
- [ ] UI responsive on all devices
- [ ] Security validations passed
- [ ] Performance acceptable
- [ ] Browser compatibility verified
- [ ] File cleanup on errors working

---

## Debugging Tips

### Enable Verbose Logging
```typescript
// In routes.ts
console.log("[DEBUG] File upload started:", req.file);
console.log("[DEBUG] FormData received:", req.body);
```

### Check Network Tab
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Click Register button
4. Observe POST request details
5. Check Response and FormData tabs

### Verify File System
```bash
# List uploaded files
ls -lah uploads/staff_documents/

# Check file size
stat uploads/staff_documents/filename.pdf

# Verify file integrity
file uploads/staff_documents/filename.pdf
```

### Check Database
```javascript
// MongoDB
db.staff.find({staff_id_document: {$exists: true}}).pretty()
```

---

## Rollback Instructions

If issues arise:

```bash
# Revert changes
git revert HEAD

# Remove uploaded files
rm -rf uploads/

# Reinstall without multer
npm install
```

---

## Support & Troubleshooting

For issues not covered above:
1. Check browser console for JavaScript errors
2. Check server logs for backend errors
3. Verify MongoDB connection and staff collection
4. Ensure all imports are correct in routes.ts
5. Verify static.ts serves `/uploads` route
6. Check package.json has multer and @types/multer

