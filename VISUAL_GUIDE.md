# Visual Component Guide

## 🌙 Theme Toggle Button

### Location
- **Desktop**: Top-right corner of navbar (next to user profile)
- **Mobile**: Inside hamburger menu at the top

### Appearance

#### Light Mode (Active)
```
┌─────────┐
│   ☀️    │  ← Sun icon (yellow background implied)
└─────────┘
Tooltip: "Switch to dark mode"
```

#### Dark Mode (Active)
```
┌─────────┐
│   🌙    │  ← Moon icon (white background implied)
└─────────┘
Tooltip: "Switch to light mode"
```

### Behavior
1. Click button → Theme switches instantly
2. 300ms smooth color transition
3. All UI elements change color
4. Icon flips (🌙 ↔ ☀️)
5. Preference saved to localStorage

---

## 🔴 Urgency Selection Popup

### Appearance
```
╔════════════════════════════════════════╗
║ Select Blood Request Urgency           ║
│                                         │
│ Please choose the urgency level to      │
│ help hospitals and donors respond       │
│ faster.                                 │
│                                         │
│ ○ 🔴 Critical                          │
│   Immediate life-threatening emergency │
│                                         │
│ ○ 🟠 High                              │
│   Needed within a few hours             │
│                                         │
│ ○ 🟡 Medium                            │
│   Needed within 24 hours                │
│                                         │
│ ○ 🟢 Low                               │
│   Planned or non-emergency request      │
│                                         │
│ [Error message if validation fails]    │
│                                         │
│         [Cancel]  [Confirm & Continue] │
╚════════════════════════════════════════╝
```

### Interactive States

#### Initial State (No Selection)
- All radio buttons empty
- Confirm button disabled (grayed out)
- No error message

#### After Selection
```
Selected option shows:
- Filled radio button ●
- Blue border highlight
- Background color active
- Confirm button enabled (clickable)
```

Example - Critical Selected:
```
●🔴 Critical
   Immediate life-threatening emergency
   [Border: Blue] [Background: Light red]
```

#### Error State
```
┌────────────────────────────────────┐
│ ⚠️ Please select an urgency level  │
│    before proceeding               │
└────────────────────────────────────┘
```

---

## 🎨 Urgency Badge

### Badge Styles

#### Critical (Red)
```
┌─────────────────────┐
│ 🔴 Critical         │  
│ Background: Red     │
│ Text: Dark Red      │
│ Border: Dark Red    │
└─────────────────────┘
```

#### High (Orange)
```
┌─────────────────────┐
│ 🟠 High             │
│ Background: Orange  │
│ Text: Dark Orange   │
│ Border: Dark Orange │
└─────────────────────┘
```

#### Medium (Yellow)
```
┌─────────────────────┐
│ 🟡 Medium           │
│ Background: Yellow  │
│ Text: Dark Yellow   │
│ Border: Dark Yellow │
└─────────────────────┘
```

#### Low (Green)
```
┌─────────────────────┐
│ 🟢 Low              │
│ Background: Green   │
│ Text: Dark Green    │
│ Border: Dark Green  │
└─────────────────────┘
```

### Sizes

#### Small (sm)
```
[🔴 Critical]  ← Compact size for inline display
```

#### Medium (md) - Default
```
[🔴 Critical]  ← Standard size for list display
```

#### Large (lg)
```
[🔴 Critical]  ← Large size for detail views
```

### Dark Mode Adaptation

#### Critical (Dark)
```
Background: Dark Red (#7F1D1D)
Text: Light Red (#FCA5A5)
Border: Dark Red Lighter (#991B1B)
```

#### Similar for High, Medium, Low
- Backgrounds become darker
- Text becomes lighter
- Contrast maintained

---

## 📋 Request Display with Urgency

### Before (Old)
```
┌─────────────────────────────────────────┐
│ Alice Walker [Critical]                 │
│ Needs 2 units of B- at City General    │
│                                  [View] │
└─────────────────────────────────────────┘
```

### After (New - with Urgency Badge)
```
┌─────────────────────────────────────────┐
│ Alice Walker [Critical] [🔴 Critical]   │
│ Needs 2 units of B- at City General    │
│                                  [View] │
└─────────────────────────────────────────┘
```

### Multiple Requests Example
```
┌──────────────────────────────────────────────┐
│ Incoming Requests                            │
├──────────────────────────────────────────────┤
│ Alice Walker [Critical] [🔴 Critical]       │
│ Needs 2 units of B- at City General        │
│                                       [View] │
├──────────────────────────────────────────────┤
│ Bob Smith [Pending] [🟠 High]               │
│ Needs 1 unit of O- at St. Mary's           │
│                                       [View] │
├──────────────────────────────────────────────┤
│ Carol Jones [Pending] [🟡 Medium]           │
│ Needs 3 units of A+ at Central Hospital    │
│                                       [View] │
├──────────────────────────────────────────────┤
│ David Brown [Pending] [🟢 Low]              │
│ Needs 1 unit of AB- at North Medical       │
│                                       [View] │
└──────────────────────────────────────────────┘
```

---

## 🎨 Color Palette

### Light Mode
```
┌─────────────────────────────────┐
│ Background:   ◼ White (#FFFFFF) │
│ Foreground:   ◼ Dark Blue       │
│ Cards:        ◼ White           │
│ Primary:      ◼ Rose (#F43F5E)  │
│ Border:       ◼ Light Gray      │
└─────────────────────────────────┘
```

### Dark Mode
```
┌─────────────────────────────────┐
│ Background:   ◼ Dark Blue       │
│ Foreground:   ◼ Light Gray      │
│ Cards:        ◼ Darker Blue     │
│ Primary:      ◼ Light Rose      │
│ Border:       ◼ Medium Gray     │
└─────────────────────────────────┘
```

### Urgency Colors
```
Critical  ◼ Red      (#DC2626)
High      ◼ Orange   (#EA580C)
Medium    ◼ Yellow   (#B45309)
Low       ◼ Green    (#22C55E)
```

---

## 🔄 Transition Effects

### Theme Switching (300ms)
```
Light Mode → [Smooth Fade] → Dark Mode
└─ All colors transition smoothly
└─ Icon changes immediately
└─ No page reload
└─ No white flash
```

### Button State Changes
```
Disabled State (Grayed)
    ↓
  [Click]
    ↓
Enabled State (Bright)
```

---

## 📱 Responsive Behavior

### Desktop Layout
```
┌────────────────────────────────────────────┐
│ Logo    Links        User    [🌙] [Logout] │
├────────────────────────────────────────────┤
│                                            │
│           Main Content Area                │
│                                            │
├────────────────────────────────────────────┤
│ Footer                                     │
└────────────────────────────────────────────┘
```

### Tablet Layout
```
┌────────────────────────────────────┐
│ Logo  [Links]  User  [🌙] [Logout] │
├────────────────────────────────────┤
│                                    │
│       Main Content Area            │
│                                    │
├────────────────────────────────────┤
│ Footer                             │
└────────────────────────────────────┘
```

### Mobile Layout
```
┌──────────────────────┐
│ Logo        [≡]      │
├──────────────────────┤
│                      │
│   Main Content       │
│   (Full Width)       │
│                      │
├──────────────────────┤
│ Footer               │
└──────────────────────┘

Tap [≡] reveals:
- Links
- Theme Toggle [🌙]
- User Profile
- Logout
```

---

## ✨ Animation Timings

| Animation | Duration | Easing |
|-----------|----------|--------|
| Theme transition | 300ms | ease |
| Popup fade-in | 200ms | ease-out |
| Badge slide | 150ms | ease |
| Button press | 100ms | linear |

---

## 🎯 User Flows

### Theme Toggle Flow
```
User clicks [🌙/☀️]
    ↓
Theme toggles
    ↓
Colors transition (300ms)
    ↓
Theme saved to localStorage
    ↓
Complete ✓
```

### Urgency Selection Flow
```
User fills form
    ↓
Clicks "Submit Request"
    ↓
Popup appears (centered)
    ↓
User selects urgency
    ↓
Option highlights
    ↓
User clicks "Confirm"
    ↓
Request submitted with urgency
    ↓
Success message shown
    ↓
Form resets
    ↓
Complete ✓
```

### Badge Display Flow
```
Hospital staff views "Incoming Requests"
    ↓
Each request displays with:
- Status badge (Critical/Pending)
- Urgency badge (Critical/High/Medium/Low)
    ↓
Staff can quickly identify urgent requests
    ↓
Click "View Details" for more info
    ↓
Complete ✓
```

---

## 🎨 Visual Hierarchy

### On Request Card
```
1. Patient Name (Primary)
   ↓
2. Status Badge + Urgency Badge (Secondary)
   ↓
3. Request Details (Tertiary)
   ↓
4. Action Button (Interactive)
```

### In Navbar
```
1. Logo (Primary)
   ↓
2. Navigation Links (Secondary)
   ↓
3. User Info (Tertiary)
   ↓
4. Theme Toggle (Subtle) [🌙/☀️]
   ↓
5. Action Buttons (Call-to-action)
```

---

**Designed for:** Blood Flow Hub - Blood Donation Platform
**Created:** January 2026
**Version:** 1.0
