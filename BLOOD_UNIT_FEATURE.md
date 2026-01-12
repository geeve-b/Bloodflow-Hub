# Blood Unit Management Feature

## Overview
A new feature has been added to the **Hospital Staff Dashboard** that allows hospital staff to manually add blood units to their hospital's blood inventory.

## Feature Description

### Add Blood Unit Form
The "Add Blood Unit" feature provides a user-friendly dialog form for hospital staff to:
- Select blood type (O+, O-, A+, A-, B+, B-, AB+, AB-)
- Enter quantity of units to add
- Set expiry date for the blood
- Specify the status (Available, Reserved, or Expired)

### Location
The "Add Blood Unit" button is located in the **Blood Inventory Section** of the Hospital Staff Dashboard, next to the section title.

## How to Use

### Step 1: Navigate to Hospital Staff Dashboard
- Log in as a hospital staff member
- You will be automatically directed to the Hospital Staff Dashboard

### Step 2: Locate Blood Inventory Section
- Scroll down to find the "Blood Inventory" section
- You will see a list of available blood types and their current quantities

### Step 3: Click "Add Blood Unit" Button
- Click the green "Add Blood Unit" button with the plus icon
- A dialog form will open

### Step 4: Fill in the Form
1. **Blood Type** (Required)
   - Select the blood type from the dropdown
   - Options: O+, O-, A+, A-, B+, B-, AB+, AB-

2. **Quantity** (Required)
   - Enter the number of units to add
   - Must be a positive number (minimum 1)
   - Example: "5" for 5 units

3. **Expiry Date** (Required)
   - Click to open a date picker
   - Select a future date (cannot be today or earlier)
   - This represents when the blood will expire

4. **Status** (Optional)
   - Select from three options:
     - **Available** (Green): Blood is ready for use
     - **Reserved** (Yellow): Blood is reserved for a specific request
     - **Expired** (Red): Blood has expired
   - Default: Available

### Step 5: Review Summary
- Before submitting, review the summary box that displays:
  - Number of units being added
  - Blood type
  - Expiry date

### Step 6: Submit the Form
- Click "Add Blood Unit" to submit
- The form will process your request
- On success, you'll see a success toast notification
- The blood inventory will automatically refresh

## Form Validation

The form includes automatic validation for:
- ✓ Blood type selection is required
- ✓ Quantity must be a positive number
- ✓ Expiry date must be selected
- ✓ Expiry date must be in the future (not today or past)

If validation fails, you'll see an error toast with the specific issue.

## API Integration

### Endpoint
**POST** `/api/blood-inventory`

### Request Body
```json
{
  "hospitalId": "string",
  "bloodType": "string (O+, O-, A+, A-, B+, B-, AB+, AB-)",
  "quantity": "number (positive integer)",
  "expiryDate": "ISO 8601 date string",
  "status": "string (available, reserved, or expired)"
}
```

### Response
On success, returns the created blood inventory record:
```json
{
  "_id": "string",
  "hospitalId": "string",
  "bloodType": "string",
  "quantity": "number",
  "expiryDate": "date",
  "status": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Features

### Auto-Refresh
- After successfully adding a blood unit, the blood inventory display automatically refreshes
- No need to manually refresh the page

### Real-time Validation
- Form provides immediate feedback on errors
- Date picker prevents selection of past dates
- Quantity field only accepts positive numbers

### User-Friendly Design
- Clear form labels with required field indicators (red asterisk)
- Helpful hints below each field
- Summary preview before submission
- Disabled buttons during processing to prevent double-submissions

### Status Color Coding
- **Green**: Available blood - ready for requests
- **Yellow**: Reserved blood - allocated for specific requests
- **Red**: Expired blood - no longer usable

## Blood Inventory Display

### Card View
After adding blood units, they appear in the inventory cards showing:
- Blood type (large, bold text in primary color)
- Quantity in units
- Expiry date
- Status badge
- Visual warning (orange border) if blood is expiring within 7 days

### Filtering
Currently, only "Available" blood units are displayed in the inventory cards. Reserved and expired units can be managed through the backend.

## Technical Implementation

### Files Modified/Created
1. **Created**: `/client/src/components/dashboard/AddBloodUnitForm.tsx`
   - New component for the blood unit form
   - Handles form state and validation
   - Makes API calls to add blood units

2. **Modified**: `/client/src/pages/HospitalStaffDashboard.tsx`
   - Added import for AddBloodUnitForm component
   - Integrated the Add Blood Unit button in the inventory section
   - Added automatic refresh function on successful submission

### Component Props
```typescript
interface AddBloodUnitFormProps {
  hospitalId: string;      // Hospital ID of the staff member
  onSuccess?: () => void;  // Callback function when blood is added successfully
}
```

## Error Handling

The form handles various error scenarios:
- ✗ Missing required fields
- ✗ Invalid quantity (zero or negative)
- ✗ Invalid/past expiry date
- ✗ Server errors during submission
- ✗ Network errors

Each error displays a clear toast notification explaining what went wrong.

## Best Practices

When using the Add Blood Unit feature:

1. **Accurate Information**
   - Ensure correct blood type is selected
   - Input accurate quantity counts
   - Set correct expiry dates based on actual blood unit expiration

2. **Regular Updates**
   - Add blood units as soon as new supplies arrive
   - Update status when blood is reserved for requests
   - Monitor expiry dates and update status when blood expires

3. **Inventory Management**
   - Maintain adequate stock levels
   - Check expiry dates regularly
   - Plan blood drives based on inventory needs

## Future Enhancements

Potential improvements to this feature:
- Bulk import of blood units (CSV upload)
- Edit existing blood inventory records
- Delete blood inventory records
- Blood unit history/audit trail
- Barcode scanning integration
- Blood type grouping/organization
- Advanced inventory analytics
- Expiry date alerts and notifications
- Integration with donation tracking system

## Troubleshooting

### Form won't submit
- Check that all required fields are filled (marked with red asterisk)
- Ensure expiry date is in the future
- Verify quantity is a positive number

### Success notification not appearing
- The API call may have failed silently
- Check browser console (F12) for errors
- Verify the hospital ID is correct

### Inventory not refreshing
- Try refreshing the page manually (F5)
- Check if the blood unit was actually created in the database
- Verify your user has hospital staff role

### Can't see the Add Blood Unit button
- Ensure you're logged in as hospital staff
- The button should appear in the Blood Inventory section header
- Try scrolling down to the Blood Inventory section

## Related Endpoints

The Add Blood Unit feature uses the following related endpoints:

- **GET** `/api/blood-inventory/hospital/:hospitalId` - Fetch hospital's blood inventory
- **POST** `/api/blood-inventory` - Add new blood unit (used by this feature)
- **PUT** `/api/blood-inventory/:id` - Update existing blood unit
- **DELETE** `/api/blood-inventory/:id` - Delete blood unit

## Support

For issues or feature requests related to the blood inventory management system, please contact the development team or check the main documentation at the root of the project.
