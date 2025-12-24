# Hospital Staff Dashboard - Visual Reference Guide

## 🎨 Dashboard Layout

### Full Screen Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]                                                          │
│  LifeFlow                          [Staff Name] [Dashboard] [Logout]
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Hospital Staff Dashboard                                        │
│  Blood Management & Request System                               │
│  Doctor • City General Hospital                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────┬──────────────────┐
│   Active Req.    │  Critical Cases  │ Total Requests   │
│        12        │        3         │       35         │
│                  │                  │                  │
│  Pending or      │  Requires        │  Based on        │
│  approved        │  immediate       │  current         │
│  requests        │  attention       │  filters         │
└──────────────────┴──────────────────┴──────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│  Active Requests                                                 │
│  View and manage blood requests from patients and hospitals      │
│                                                                   │
│  [Filter Panel]                                                  │
│  Status: [All Statuses ▼]   Urgency: [All Urgencies ▼]         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Request ID │ Patient │ Blood │ Qty │ Urgency │ Status  │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ 12345      │ John    │ O+    │ 2   │ Critical│ Pending │    │
│  │ 12346      │ Jane    │ A-    │ 1   │ High    │ Approved│    │
│  │ 12347      │ Bob     │ B+    │ 3   │ Medium  │ Fulfilled
│  │ 12348      │ Alice   │ AB-   │ 1   │ Low     │ Rejected│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Component Breakdown

### 1. Statistics Section
```
┌──────────────────────────────────────────┐
│ [Icon] Active Requests        [Card]      │
│        12                                  │
│        Pending or approved requests        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ [Icon] Critical Cases         [Card]      │
│        3                                   │
│        Requires immediate attention       │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ [Icon] Total Requests         [Card]      │
│        35                                  │
│        Based on current filters           │
└──────────────────────────────────────────┘
```

### 2. Filter Panel
```
┌─────────────────────────────────────────────┐
│ [Filter Icon] Filter Requests              │
├─────────────────────────────────────────────┤
│                                              │
│  Status              Urgency                 │
│  [All Statuses ▼]   [All Urgencies ▼]      │
│   • Pending          • Critical              │
│   • Approved         • High                  │
│   • Fulfilled        • Medium                │
│   • Rejected         • Low                   │
│                                              │
└─────────────────────────────────────────────┘
```

### 3. Requests Table
```
┌─────────────────────────────────────────────────────────────────────┐
│ Request ID │ Patient │ Blood │ Qty  │ Urgency │ Status    │ Date    │
├─────────────────────────────────────────────────────────────────────┤
│ 12345      │ John    │ [O+]  │ 2 u  │ [🔴 Crit] │ [Pending] │ 01/15 │
│ 12346      │ Jane    │ [A-]  │ 1 u  │ [🟠 High] │ [Approve] │ 01/14 │
│ 12347      │ Bob     │ [B+]  │ 3 u  │ [🟡 Med]  │ [Fulfill] │ 01/13 │
│ 12348      │ Alice   │ [AB-] │ 1 u  │ [🟢 Low]  │ [Reject]  │ 01/12 │
│            │         │       │      │          │           │        │
│            [View Details Button for each row]            │        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔴 Color Reference

### Urgency Color Scheme
```
Critical  ██████████  Red       (#DC2626)   🔴
High      ██████████  Orange    (#EA580C)   🟠
Medium    ██████████  Yellow    (#CA8A04)   🟡
Low       ██████████  Green     (#16A34A)   🟢
```

### Status Color Scheme
```
Fulfilled ██████████  Green     (#16A34A)   🟢
Approved  ██████████  Blue      (#2563EB)   🔵
Pending   ██████████  Yellow    (#CA8A04)   🟡
Rejected  ██████████  Red       (#DC2626)   🔴
```

### UI Palette
```
Primary:     Blue       - Used for main actions and highlights
Secondary:   Gray       - Used for muted text and borders
Success:     Green      - Used for positive states
Warning:     Yellow     - Used for caution states
Danger:      Red        - Used for critical/error states
Background:  White      - Main background
Surface:     Light Gray - Card and component backgrounds
```

---

## 🖼️ Modal Illustration

### Details Modal Layout
```
╔════════════════════════════════════════════════════╗
║  Blood Request Details                        [X]   ║
╠════════════════════════════════════════════════════╣
║                                                     ║
║  [Droplet Icon] Blood Requirement Details          ║
║  ─────────────────────────────────────────────────  ║
║  PATIENT NAME              BLOOD GROUP REQUIRED    ║
║  John Doe                  O+                      ║
║                                                     ║
║  QUANTITY                  PURPOSE                 ║
║  2 Units                   Emergency Surgery       ║
║                                                     ║
║  TYPE OF OPERATION                                 ║
║  Emergency Blood Transfusion                       ║
║                                                     ║
║  ─────────────────────────────────────────────────  ║
║                                                     ║
║  [Clock Icon] Time Requirement                     ║
║  ─────────────────────────────────────────────────  ║
║  REQUIRED WITHIN           URGENCY LEVEL           ║
║  Within 24 hours           [Critical 🔴]           ║
║                                                     ║
║  ─────────────────────────────────────────────────  ║
║                                                     ║
║  [MapPin Icon] Hospital Details                    ║
║  ─────────────────────────────────────────────────  ║
║  HOSPITAL NAME             LOCATION                ║
║  City General Hospital     123 Medical Ave         ║
║                                                     ║
║  CONTACT NUMBER                                    ║
║  555-1234                                          ║
║                                                     ║
║  ─────────────────────────────────────────────────  ║
║                                                     ║
║  [FileText Icon] Additional Information            ║
║  ─────────────────────────────────────────────────  ║
║  REQUEST ID                REQUEST DATE             ║
║  507f1f77bcf86cd799439011 Jan 15, 2024 10:30 AM   ║
║                                                     ║
║  STATUS                                            ║
║  [Pending 🟡]                                      ║
║                                                     ║
║  REMARKS                                           ║
║  ┌─────────────────────────────────────────────┐  ║
║  │ Patient requires immediate transfusion      │  ║
║  │ following emergency surgery...              │  ║
║  └─────────────────────────────────────────────┘  ║
║                                                     ║
║  [Close Button]         [Process Request Button]   ║
║                                                     ║
╚════════════════════════════════════════════════════╝
```

---

## 📱 Mobile View

### Mobile Header
```
┌──────────────────────────────────┐
│ [≡] LifeFlow    [👤] [🔓]        │
└──────────────────────────────────┘
```

### Mobile Cards (Stacked)
```
┌─────────────────────────┐
│ [Icon] Active Requests  │
│        12               │
│        Pending requests │
└─────────────────────────┘

┌─────────────────────────┐
│ [Icon] Critical Cases   │
│        3                │
│        Immediate action │
└─────────────────────────┘

┌─────────────────────────┐
│ [Icon] Total Requests   │
│        35               │
│        Current filters  │
└─────────────────────────┘
```

### Mobile Table (Horizontal Scroll)
```
┌──────────────────────────────────────┐
│ ← Request │ Patient │ Blood │ Qty → │
│   12345   │ John    │  O+   │ 2 u   │
│───────────────────────────────────────│
│ Urgency │ Status  │ Date  │ Action  │
│ Critical│ Pending │ 01/15 │ [View]  │
│───────────────────────────────────────│
│ ← 12346 │ Jane    │  A-   │ 1 u  → │
│───────────────────────────────────────│
│ High    │ Approve │ 01/14 │ [View]  │
└──────────────────────────────────────┘

← Swipe to see more columns →
```

### Mobile Modal (Full Screen)
```
┌──────────────────────────────┐
│ Blood Request Details   [X]   │
├──────────────────────────────┤
│                              │
│ Blood Requirement Details    │
│ Patient: John Doe            │
│ Blood: O+                    │
│ Qty: 2 Units                 │
│                              │
│ Time Requirement             │
│ Within: 24 hours             │
│ Urgency: Critical 🔴         │
│                              │
│ Hospital Details             │
│ Name: City Hospital          │
│ Address: 123 Medical Ave     │
│ Phone: 555-1234              │
│                              │
│ Additional Info              │
│ ID: 507f1f77...              │
│ Date: Jan 15, 2024           │
│ Status: Pending 🟡           │
│                              │
│ Remarks                      │
│ Patient requires immediate   │
│ transfusion following        │
│ emergency surgery...         │
│                              │
│ [Close] [Process]            │
│                              │
└──────────────────────────────┘
```

---

## 🎯 Icon Usage

### Navigation Icons
```
[Droplets] - Blood icon in logo and header
[Menu] - Mobile menu toggle
[X] - Close button
[≡] - Hamburger menu
```

### Status Icons
```
[AlertTriangle] - Critical/High urgency indicator
[Clock] - Time-related information
[MapPin] - Location information
[Phone] - Contact information
[FileText] - Document/information icon
[Filter] - Filter controls
```

### Action Icons
```
[Logout] - Logout button
[Dashboard] - Navigation button
[View Details] - Open details modal
```

---

## 🎨 Typography

### Heading Hierarchy
```
H1 (32px, Bold)
Hospital Staff Dashboard

H2 (24px, Bold)
Active Requests

H3 (18px, Semi-bold)
Blood Requirement Details

Body (14px, Regular)
Patient Name: John Doe

Small (12px, Regular)
Required within timestamp
```

### Font Weights
```
Bold (700)     - Headings, important text
Semibold (600) - Section headings, labels
Regular (400)  - Body text, descriptions
```

---

## 🔄 User Interactions

### Table Row Hover
```
Before:  │ Normal row background │
After:   │ Slightly darker bg    │
         └─ "View Details" button highlighted
```

### Filter Selection
```
Default: [All Statuses ▼]
Active:  [Pending ▼] ← Selected filter applied
```

### Modal Open Animation
```
Trigger: Click "View Details"
Effect:  Modal slides in from center
Timing:  200ms smooth animation
```

### Modal Close Animation
```
Trigger: Click "X" or "Close"
Effect:  Modal fades out
Timing:  150ms smooth animation
```

---

## 📊 Data Visualization

### Statistics Cards Layout
```
┌─────────────────────────┐
│ [Icon]                  │
│ Active Requests         │ ← Title
│ 12                      │ ← Large number
│ Pending or approved     │ ← Description
│ requests                │
└─────────────────────────┘
```

### Badge Styling
```
Blood Type: [O+] ← White background, dark text

Urgency:    [🔴 Critical] ← Red background, white text

Status:     [Pending] ← Yellow background, dark text
```

---

## 🔐 Access States

### Authorized State (Hospital Staff)
```
✅ Full dashboard visible
✅ All data accessible
✅ All actions available
✅ Normal navigation
```

### Unauthorized State (Non-Hospital)
```
❌ Dashboard hidden
⚠️ "Access Denied" message shown
🔐 Redirect to login option
```

### Unauthenticated State (No Login)
```
❌ Redirect to login page
🔐 Session required message
🔗 Login link provided
```

---

## 📐 Spacing & Dimensions

### Card Padding
```
Horizontal: 16px (mobile), 24px (desktop)
Vertical:   12px (mobile), 20px (desktop)
Gap:        16px (between cards)
```

### Table Spacing
```
Cell Padding:   12px
Row Height:     56px
Header Height:  48px
Border:         1px gray
```

### Modal Dimensions
```
Width:          90% (mobile), 700px (desktop)
Height:         90vh max
Padding:        24px
Border Radius:  8px
```

---

## 🎬 Animation Timeline

### Page Load
```
0ms:    Page starts loading
500ms:  Stats cards appear (fade in)
1000ms: Table loads with data
1500ms: Loading state removed
```

### Filter Application
```
0ms:    Filter changed
100ms:  Table refreshes
200ms:  New data displays
```

### Modal Transition
```
0ms:    View Details clicked
100ms:  Modal appears (fade in)
200ms:  Modal fully visible
```

---

## ✅ Accessibility Features

### Keyboard Navigation
```
Tab:        Move between interactive elements
Enter:      Activate buttons/links
Escape:     Close modal
Arrow Keys: Navigate within select dropdowns
```

### Screen Reader Support
```
Role labels for interactive elements
ARIA descriptions for complex components
Semantic HTML structure
Alt text for icons
```

### Visual Accessibility
```
Color not only indicator (icons + badges)
High contrast ratios
Readable font sizes (14px minimum)
Clear focus indicators
```

---

## 🖨️ Print Styles

### Printable Layout
```
✅ Header prints
✅ Statistics cards print
✅ Table prints with all data
✅ Colors adjust for print
✅ Navigation hidden
✅ Modal content printable
```

---

## 📋 Summary

This visual reference provides:
- ✅ Complete layout diagrams
- ✅ Component breakdowns
- ✅ Color specifications
- ✅ Typography guidelines
- ✅ Spacing & dimensions
- ✅ Animation timings
- ✅ Accessibility features
- ✅ Mobile adaptations

All visual elements follow:
- ✅ Professional design principles
- ✅ Hospital-grade aesthetics
- ✅ Accessibility standards
- ✅ Responsive guidelines
- ✅ User experience best practices

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Complete
