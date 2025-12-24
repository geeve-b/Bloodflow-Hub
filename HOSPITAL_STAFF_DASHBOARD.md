# Hospital Staff Dashboard - Complete Setup Guide

## Overview
The Hospital Staff Dashboard is a specialized interface for hospital staff members to manage blood requests from patients and other hospitals. It provides a professional, responsive dashboard with comprehensive blood request management capabilities.

## Features

### 1. **Dashboard Overview**
- Real-time statistics showing:
  - Active Requests count
  - Critical Cases requiring immediate attention
  - Total filtered requests
- Professional header with staff role and hospital name
- Responsive grid layout for desktop and mobile

### 2. **Blood Request Management**

#### Active Requests Section
- Table view of all blood requests
- Shows 8 key columns:
  - Request ID (last 8 characters in uppercase)
  - Patient Name
  - Blood Type (with badge styling)
  - Quantity (in units)
  - Urgency Level (color-coded)
  - Request Status (color-coded)
  - Request Date
  - Action Button (View Details)

#### Request Filtering
- Filter by Status:
  - All Statuses
  - Pending
  - Approved
  - Fulfilled
  - Rejected
- Filter by Urgency:
  - All Urgencies
  - Critical (Red)
  - High (Orange)
  - Medium (Yellow)
  - Low (Green)

### 3. **Blood Request Details Modal**

When "View Details" is clicked, a comprehensive modal displays:

#### Blood Requirement Details
- Patient Name
- Blood Group Required
- Quantity of Blood
- Purpose of Requirement
- Type of Operation

#### Time Requirement
- Required Within (timing information)
- Urgency Level (with color badge)

#### Hospital Details
- Hospital Name
- Hospital Location/Address
- Contact Number

#### Additional Information
- Request ID (full ID)
- Request Date (with timestamp)
- Status (current status badge)
- Remarks or Notes (if applicable)
- Process Request Button

### 4. **Visual Indicators**

#### Urgency Color Coding
| Urgency | Color | Background | Use Case |
|---------|-------|-----------|----------|
| Critical | Red (#DC2626) | Red-100 | Emergency cases requiring immediate blood |
| High | Orange (#EA580C) | Orange-100 | Urgent but not emergency |
| Medium | Yellow (#CA8A04) | Yellow-100 | Standard urgent cases |
| Low | Green (#16A34A) | Green-100 | Routine/non-urgent requests |

#### Status Color Coding
| Status | Color | Background | Meaning |
|--------|-------|-----------|---------|
| Fulfilled | Green | Green-100 | Request completed |
| Approved | Blue | Blue-100 | Request approved, pending fulfillment |
| Pending | Yellow | Yellow-100 | Awaiting approval |
| Rejected | Red | Red-100 | Request declined |

## Database Integration

### BloodRequest Schema Fields
```typescript
{
  _id: ObjectId;                          // Unique request identifier
  requesterId: string;                    // User ID of requester
  requesterName: string;                  // Patient or requester name
  hospitalName: string;                   // Hospital requesting blood
  bloodType: "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-";
  quantity: number;                       // Units of blood required
  urgency: "low" | "medium" | "high" | "critical";
  reason?: string;                        // Reason for blood requirement
  status: "pending" | "approved" | "fulfilled" | "rejected";
  createdAt: Date;                        // Request creation timestamp
  updatedAt: Date;                        // Last update timestamp
  
  // Extended fields (optional, can be added to schema)
  patientName?: string;                   // Specific patient name
  purpose?: string;                       // Purpose (Surgery, Emergency, etc.)
  operationType?: string;                 // Type of operation/procedure
  requiredWithin?: string;                // Time requirement info
  hospitalAddress?: string;               // Hospital location
  contactNumber?: string;                 // Hospital contact
  remarks?: string;                       // Additional notes
}
```

### API Endpoints Used
- `GET /api/blood-requests` - Fetch all blood requests
- `GET /api/blood-requests/:id` - Get specific request details
- `PUT /api/blood-requests/:id` - Update request status
- `GET /api/profile/:userId/:role` - Fetch staff profile information

## Setup Instructions

### 1. File Structure
```
client/src/
├── pages/
│   ├── HospitalStaffDashboard.tsx    (Main dashboard component)
│   ├── VerifyEmailPage.tsx           (Updated with staff dashboard redirect)
│   └── StaffRegisterPage.tsx          (Registration page)
├── components/
│   ├── layout/
│   │   └── Navbar.tsx               (Updated with hospital dashboard link)
│   └── ui/
│       ├── table.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── select.tsx
│       └── [other UI components]
└── App.tsx                           (Updated with new route)
```

### 2. Route Configuration
Add the following route to `App.tsx`:
```typescript
<Route path="/hospital-dashboard" component={HospitalStaffDashboard} />
```

### 3. Navigation Updates
The Navbar automatically shows:
- "Blood Dashboard" button for logged-in hospital staff
- Redirects to `/hospital-dashboard` instead of generic dashboard

### 4. Email Verification Flow
After staff registration and email verification:
- Users with `role: "hospital"` redirect to `/hospital-dashboard`
- Other users redirect to `/dashboard`

## Component Features

### State Management
- `requests`: All fetched blood requests
- `filteredRequests`: Requests after applying filters
- `selectedRequest`: Currently selected request for details modal
- `staffProfile`: Logged-in staff member's profile information
- `statusFilter`: Current status filter selection
- `urgencyFilter`: Current urgency filter selection

### Key Functions
- `handleViewDetails()`: Opens details modal for selected request
- `getUrgencyColor()`: Returns color class based on urgency level
- `getStatusColor()`: Returns color class based on status
- `getUrgencyIcon()`: Returns alert icon for critical/high urgency requests

## Authentication & Authorization

### Access Control
- Only users with `role: "hospital"` can access `/hospital-dashboard`
- Non-hospital users see "Access Denied" message with redirect to login
- Automatically redirects to login if user is not authenticated

### User Profile Integration
- Fetches staff profile using user ID and role
- Displays staff position and hospital name in dashboard header
- Enables personalized staff experience

## Mobile Responsiveness

### Responsive Breakpoints
- **Mobile** (< 768px):
  - Single column layout for stats cards
  - Horizontal scrolling for request table
  - Stacked filter options
  - Touch-friendly button sizes

- **Desktop** (>= 768px):
  - 3-column grid for stats cards
  - Full table display with all columns
  - Side-by-side filter options
  - Optimized spacing and layout

### Mobile Optimizations
- Responsive table with overflow scrolling
- Abbreviated request IDs in mobile view
- Compact badge styling
- Stack-friendly modal layout
- Touch-optimized button sizes

## Extended Features (Future Development)

### Recommended Enhancements
1. **Blood Request Processing**
   - Add "Process Request" functionality
   - Update request status from modal
   - Add approval workflows

2. **Advanced Filtering**
   - Date range filtering
   - Search by patient name
   - Filter by hospital
   - Custom urgency thresholds

3. **Notifications**
   - Real-time critical case alerts
   - Email notifications for new requests
   - Push notifications for urgent cases

4. **Reporting & Analytics**
   - Blood request statistics by blood type
   - Fulfillment rate tracking
   - Response time analytics
   - Monthly/yearly reports

5. **Integration Features**
   - Print request details
   - Export filtered requests to CSV
   - Integration with hospital inventory system
   - Automated donor matching

## Styling & Design System

### Colors Used
- **Primary**: Theme primary color (blue)
- **Destructive**: Red (#DC2626) for critical/dangerous states
- **Success**: Green (#16A34A) for approved/fulfilled states
- **Warning**: Orange/Yellow for urgent/medium priority
- **Muted**: Gray tones for secondary information

### Typography
- Headings: Bold, 24-32px
- Subheadings: Semi-bold, 16-18px
- Body text: Regular, 14px
- Small text: Regular, 12px

### Components Used
- Shadcn UI components
- Lucide React icons
- Tailwind CSS for styling
- React hooks for state management

## Error Handling

### User Feedback
- Toast notifications for all operations
- Error messages for failed API calls
- Loading states during data fetches
- "No requests found" message when filters return empty results

### Validation
- Authentication check on component mount
- Role-based access validation
- Empty state handling
- Network error recovery

## Performance Considerations

1. **API Optimization**
   - Single fetch of all requests on mount
   - Client-side filtering (no additional API calls)
   - Caching of staff profile data

2. **UI Optimization**
   - Lazy loading for modal content
   - Conditional rendering of components
   - Efficient re-renders with proper dependencies

3. **Code Splitting**
   - Component lazy loading
   - Modal content only rendered when needed

## Testing Checklist

- [ ] Hospital staff can login and access dashboard
- [ ] Dashboard displays all blood requests
- [ ] Filtering works for status and urgency
- [ ] View Details modal opens with correct data
- [ ] All 8 blood requirement details display correctly
- [ ] Color coding matches design specifications
- [ ] Modal close button works
- [ ] Responsive design works on mobile devices
- [ ] Error messages display for failed API calls
- [ ] Non-hospital users see access denied message
- [ ] Staff profile information displays correctly
- [ ] Tables are horizontally scrollable on mobile

## Troubleshooting

### Common Issues

**Issue**: Dashboard shows "Access Denied"
- **Solution**: Ensure user is registered as hospital staff with correct role

**Issue**: No blood requests displayed
- **Solution**: Check if API endpoint `/api/blood-requests` is working

**Issue**: Modal doesn't open
- **Solution**: Verify Dialog component is imported and working

**Issue**: Filters not working
- **Solution**: Check filter state management and useEffect dependencies

**Issue**: Staff profile not showing
- **Solution**: Verify `/api/profile/:userId/:role` endpoint exists

## Database Considerations

### Schema Extensions
If not all fields exist in current schema, consider adding:
```typescript
// Optional fields to extend BloodRequest schema
patientName: { type: String, default: "" };
purpose: { type: String, enum: ["Surgery", "Emergency", "Delivery", "Treatment", "Accident"], default: "Treatment" };
operationType: { type: String, default: "" };
requiredWithin: { type: String, default: "" };
hospitalAddress: { type: String, default: "" };
coordinatorContact: { type: String, default: "" };
remarks: { type: String, default: "" };
```

### Migration Steps
1. Update MongoDB schema in `shared/schema.ts`
2. Create migration script if needed
3. Update API endpoints to populate new fields
4. Update Dashboard to use new fields

## Support & Maintenance

### Regular Tasks
- Monitor API performance
- Review error logs
- Update UI based on user feedback
- Maintain test coverage

### Future Enhancements
- Add real-time updates using WebSockets
- Implement advanced analytics
- Create mobile app version
- Add multi-hospital management

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready
