# Staff ID File Upload Feature Implementation

## Overview
Added comprehensive Staff ID file upload functionality to the Staff Registration Page with client-side and server-side validation, file preview, and secure storage.

## Frontend Changes

### 1. **StaffRegisterPage.tsx Updates**

#### Imports Added
- `Upload, X, FileText` icons from lucide-react for file upload UI

#### Constants Added
```typescript
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
const ALLOWED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
```

#### Form State Updates
- Added `staffIdDocument: null as File | null` to formData state
- Added `fileError: string` state for file-specific error messages

#### New Functions Added

**handleFileChange()**: 
- Validates file type and size on selection
- Sets file in state or clears with error message
- Provides real-time validation feedback

**handleRemoveFile()**: 
- Clears selected file and error messages
- Allows users to select a different file

**Enhanced validateForm()**:
- Added file validation logic
- Checks if file exists, valid type, and size
- Sets fileError state for display

#### Form Submission Updates
- Changed from JSON submission to FormData
- File is appended to FormData for multipart/form-data submission
- Maintains backward compatibility for other fields

#### UI Component Added
New file upload section with:
- **Upload Area**: Draggable/clickable zone for file selection
- **File Preview**: 
  - Shows file icon and name for PDFs (red FileText icon)
  - Shows "IMG" placeholder for images
  - Displays file size in KB
  - Remove button to clear selection
- **Error Messages**: 
  - Clear, colored error messages for validation failures
  - Specific messages for format and size issues

## Backend Changes

### 1. **routes.ts Updates**

#### Imports Added
```typescript
import multer from "multer";
import path from "path";
import fs from "fs";
```

#### Multer Configuration
- Storage destination: `uploads/staff_documents/`
- Auto-creates directory if it doesn't exist
- Unique filenames using timestamp + random number + extension
- File filter validates MIME types
- Size limit: 5 MB
- Allowed types: PDF, JPEG, PNG

#### Updated POST /api/staff Endpoint
- Added upload middleware: `uploadMiddleware.single("staffIdDocument")`
- Handles FormData from client
- Extracts file path and adds to payload as `staff_id_document`
- Cleans up uploaded file if database operation fails
- Error handling with proper cleanup

### 2. **static.ts Updates**
- Added static route `/uploads` to serve uploaded files
- Files accessible via `/uploads/staff_documents/{filename}`
- Only serves if uploads directory exists

### 3. **schema.ts Updates**
- Added `staff_id_document: z.string().optional()` to staffSchema
- Updated insertStaffSchema to include staff_id_document field
- Stores file path in database for future retrieval

## Dependencies Added

### Production Dependencies
- `multer@^1.4.5`: File upload middleware

### Development Dependencies
- `@types/multer@^1.4.11`: TypeScript definitions for multer

## Configuration

### .gitignore
- Added `uploads/` directory to prevent tracking uploaded files

## File Organization

### Directory Structure
```
project/
├── uploads/
│   └── staff_documents/
│       ├── {timestamp}-{random}.pdf
│       ├── {timestamp}-{random}.jpg
│       └── ...
```

## Validation Features

### Client-Side (Immediate Feedback)
- ✅ File type validation (PDF, JPG, JPEG, PNG only)
- ✅ File size validation (max 5 MB)
- ✅ Required file validation
- ✅ Real-time error messages
- ✅ Visual feedback (preview/remove capability)

### Server-Side (Security)
- ✅ Multer MIME type filtering
- ✅ File size limit enforcement
- ✅ Secure filename generation
- ✅ Error recovery with file cleanup
- ✅ Directory creation with proper permissions

## User Experience

### Upload Process
1. User clicks on upload area or drags file
2. File is validated on selection
3. Valid files show preview with name and size
4. Invalid files show specific error message
5. User can remove file to select another
6. File is submitted with registration form

### Visual Indicators
- ✅ Green icons: Successful/pending states
- ✅ Red icons: Error states
- ✅ File type icons: PDF vs Images
- ✅ Size display: File size in KB
- ✅ Error messages: Specific validation failures

## Security Considerations

1. **File Type Validation**: Both client and server validate types
2. **File Size Limits**: 5 MB maximum enforced on both sides
3. **Secure Filenames**: Timestamp + random prevents conflicts
4. **Error Cleanup**: Failed uploads remove temporary files
5. **Static Route**: Files served via Express static middleware
6. **Database Link**: File path linked to staff account for access control

## Future Enhancements

1. **Admin Dashboard**: View/download uploaded documents
2. **Verification Status**: Mark staff as verified after document review
3. **Virus Scanning**: Integrate antivirus scanning before storage
4. **Cloud Storage**: Migrate to AWS S3 or Azure Blob for production
5. **Document Validation**: OCR to validate document authenticity
6. **Expiry Management**: Auto-delete old/unverified documents
7. **Access Control**: Admin-only download endpoints
8. **File Search**: Index documents for searchability

## Testing Checklist

- [ ] Upload valid PDF file
- [ ] Upload valid JPG/JPEG/PNG file
- [ ] Reject invalid file type
- [ ] Reject file > 5 MB
- [ ] Preview works for images
- [ ] PDF shows filename correctly
- [ ] Remove button clears selection
- [ ] File appears in database after registration
- [ ] File is accessible at `/uploads/staff_documents/{filename}`
- [ ] Failed upload cleans up temporary file
- [ ] Complete form submission with file

## API Response Example

### Success Response (201 Created)
```json
{
  "_id": "staff_id_123",
  "userId": "user_id_123",
  "firstName": "John",
  "lastName": "Doe",
  "staffId": "EMP001",
  "department": "General",
  "position": "Doctor",
  "phone": "+1234567890",
  "email": "john@hospital.com",
  "hospitalName": "Your Hospital",
  "staff_id_document": "/uploads/staff_documents/1699564800000-123456789.pdf",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "Invalid file type. Only PDF, JPG, JPEG, PNG are allowed"
}
```

## Installation & Setup

After pulling this update:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Restart Server**:
   ```bash
   npm run dev
   ```

3. **Test Upload**:
   - Navigate to Staff Registration page
   - Try uploading a valid PDF or image
   - Verify file appears in `/uploads/staff_documents/`
   - Check database for `staff_id_document` field

## Notes

- Files are stored locally in the `uploads/` directory
- For production, migrate to cloud storage (AWS S3, Azure Blob, etc.)
- Consider implementing document verification workflow
- Regular backups needed for uploaded files
- Set up proper file retention/archival policy
