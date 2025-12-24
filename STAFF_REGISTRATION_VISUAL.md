# Staff Registration Page - Visual Overview

## Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│              Professional Gradient Background                 │
│                                                               │
│    ┌────────────────────────────────────────────────────┐   │
│    │        STAFF REGISTRATION                          │   │
│    │   Join our hospital staff network to manage         │   │
│    │         blood inventory                            │   │
│    └────────────────────────────────────────────────────┘   │
│                                                               │
│    ┌────────────────────────────────────────────────────┐   │
│    │                                                    │   │
│    │  👤 Full Name *              🏥 Staff ID *         │   │
│    │  [________________________] [______________]       │   │
│    │                                                    │   │
│    │           Gender *                                 │   │
│    │  ◯ Male    ◯ Female    ◯ Other                    │   │
│    │                                                    │   │
│    │  📞 Contact Number *         ✉️  Email Address *  │   │
│    │  [+1 (555) 123-4567]        [user@hospital.com]   │   │
│    │                                                    │   │
│    │  🏠 Residential Address *                          │   │
│    │  [____________________________________]            │   │
│    │  [____________________________________]            │   │
│    │  [____________________________________]            │   │
│    │                                                    │   │
│    │  Username *                  💼 Designation *     │   │
│    │  [__________________]        [Doctor ▼]            │   │
│    │                                                    │   │
│    │  🔒 Password *               🔒 Confirm Pass. *   │   │
│    │  [••••••••] [👁]            [••••••••] [👁]       │   │
│    │                                                    │   │
│    │           [Reset]            [Register]            │   │
│    │                                                    │   │
│    └────────────────────────────────────────────────────┘   │
│                                                               │
│    Already have an account? [Login]                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Form Field Details

### 1. Full Name
- **Type:** Text Input
- **Icon:** 👤 User
- **Placeholder:** "John Doe"
- **Required:** Yes
- **Validation:** Non-empty string

### 2. Staff ID
- **Type:** Text Input
- **Icon:** 📛 Badge
- **Placeholder:** "EMP001"
- **Required:** Yes
- **Validation:** Non-empty string

### 3. Gender
- **Type:** Radio Buttons
- **Options:** Male, Female, Other
- **Required:** Yes
- **Default:** Male

### 4. Contact Number
- **Type:** Telephone Input
- **Icon:** 📞 Phone
- **Placeholder:** "+1 (555) 123-4567"
- **Required:** Yes
- **Validation:** 10-15 digits
- **Format:** Accepts various formats (removes non-digits for validation)

### 5. Email Address
- **Type:** Email Input
- **Icon:** ✉️ Mail
- **Placeholder:** "john@example.com"
- **Required:** Yes
- **Validation:** RFC 5322 compliant email format

### 6. Residential Address
- **Type:** Textarea
- **Icon:** 🏠 Home
- **Placeholder:** "Enter your complete residential address..."
- **Required:** Yes
- **Rows:** 4 (min-height: 100px)

### 7. Username
- **Type:** Text Input
- **Placeholder:** "john_staff"
- **Required:** Yes
- **Validation:** 
  - Minimum 3 characters
  - Must be unique (checked against database)

### 8. Designation / Role
- **Type:** Dropdown Select
- **Icon:** 💼 Briefcase
- **Options:**
  - Doctor
  - Nurse
  - Technician
  - Receptionist
- **Required:** Yes
- **Default:** Nurse

### 9. Password
- **Type:** Password Input
- **Icon:** 🔒 Lock
- **Placeholder:** "••••••••"
- **Required:** Yes
- **Validation:** 
  - Minimum 6 characters
  - Must match Confirm Password
- **Feature:** Visibility toggle (eye icon)

### 10. Confirm Password
- **Type:** Password Input
- **Icon:** 🔒 Lock
- **Placeholder:** "••••••••"
- **Required:** Yes
- **Validation:** Must match Password field
- **Feature:** Visibility toggle (eye icon)

## Error Messages

### Field-Level Validation Errors

```
Full Name *
[________________________]
Full Name is required         ← Red error message
```

### Email Format Error
```
Email Address *
[________________________]
Please enter a valid email address
```

### Contact Number Error
```
Contact Number *
[________________________]
Please enter a valid contact number (10-15 digits)
```

### Password Mismatch
```
Confirm Password *
[••••••••]
Passwords do not match
```

### Username Length
```
Username *
[________________________]
Username must be at least 3 characters
```

## Success Flow

```
User fills form correctly
        ↓
Clicks Register button
        ↓
Form validates (shows errors if any)
        ↓
API call to create user account
        ↓
Success! Toast appears:
"Staff registration successful! 
Please verify your email to login."
        ↓
Redirect to /verify-email
        ↓
User checks email for verification code
        ↓
Enters code
        ↓
Email verified ✓
        ↓
User can login as hospital staff
```

## Responsive Design

### Desktop (1200px+)
```
Form fields in 2-column grid:

Full Name          Staff ID
Gender (full width)
Contact Number     Email
Address (full width)
Username           Designation
Password           Confirm Password
```

### Tablet (768px - 1024px)
```
Form fields in 2-column grid:

Full Name          Staff ID
Gender (full width)
Contact Number     Email
Address (full width)
Username           Designation
Password           Confirm Password
Buttons stacked
```

### Mobile (<768px)
```
Form fields in 1-column:

Full Name
Staff ID
Gender
Contact Number
Email
Address
Username
Designation
Password
Confirm Password
[Reset] [Register] (stacked)
```

## Color Scheme

- **Primary Color:** Blue (for icons, links, buttons)
- **Background:** White card on gradient background
- **Border:** Subtle gray
- **Text:** Dark for labels, muted gray for descriptions
- **Error:** Red (#dc2626)
- **Success:** Green (in toast)
- **Button Hover:** Slightly darker shade

## Icons Used (from Lucide React)

- `User` - Full Name
- `Phone` - Contact Number
- `Mail` - Email Address
- `Home` - Residential Address
- `Lock` - Password fields
- `Briefcase` - Designation
- `Eye` - Show password
- `EyeOff` - Hide password

## Typography

- **Page Title:** 1.875rem (30px), Bold
- **Card Description:** 1rem (16px), Medium
- **Labels:** 0.875rem (14px), Medium, with icon
- **Error Messages:** 0.875rem (14px), Bold, Red
- **Placeholder Text:** 0.875rem (14px), Muted

## Spacing

- **Card Padding:** 1.5rem (24px)
- **Form Gaps:** 1.5rem (24px) between rows
- **Grid Gap:** 1.5rem (24px)
- **Button Gap:** 1rem (16px)
- **Field Section Gap:** 0.5rem (8px)

## Accessibility Features

- All inputs have associated labels
- Labels include field names and asterisks for required fields
- Error messages are displayed inline below fields
- Icons provide visual context
- Sufficient color contrast for readability
- Tab navigation works smoothly
- Form can be submitted with Enter key
- Screen reader friendly
- ARIA labels on all inputs

## Animations & Transitions

- Smooth focus states on inputs
- Error messages fade in/out
- Button hover effects
- Icon transitions with color changes
- Toast notifications slide in/out

## State Management

### Form State
```javascript
{
  fullName: "",
  staffId: "",
  gender: "male",
  contactNumber: "",
  email: "",
  address: "",
  username: "",
  designation: "nurse",
  password: "",
  confirmPassword: ""
}
```

### Error State
```javascript
{
  fullName: "",
  staffId: "",
  gender: "",
  contactNumber: "",
  email: "",
  address: "",
  username: "",
  designation: "",
  password: "",
  confirmPassword: ""
}
```

### UI State
```javascript
{
  loading: false,
  showPassword: false,
  showConfirmPassword: false
}
```

## Integration Points

### Routes
- `/staff-register` - Staff registration page
- `/login` - Login page (Hospital Staff tab)
- `/verify-email` - Email verification

### API Endpoints
- `POST /api/register` - Create user account
- `POST /api/staff` - Create staff profile

### Context/Hooks
- `useLocation()` - Page navigation
- `useToast()` - Notifications
- `useState()` - Form state management

## Browser Requirements

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript support
- CSS Grid and Flexbox
- Local Storage/Session Storage
- Fetch API support
