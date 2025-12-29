# TFW-ops-sales Sync Button - Visual Guide

## Button Location & Appearance

### 🎯 Where to Find the Sync Button

The "Sync to Ops-Sales" button appears in **two locations**:

#### 1. Operator Roster View
**Navigation Path:** Dashboard → Ops Roster

```
┌─────────────────────────────────────────────────────────┐
│ Daily Roster for [Date]                                  │
│ Present: 25  Absent: 3                                   │
├─────────────────────────────────────────────────────────┤
│                              ┌─────────┐  ┌──────────┐  │
│                              │ Date: ▼ │  │DL Attend │  │
│                              └─────────┘  │DL Roster │  │
│                                           │DL Assign │  │
│                                           │[Sync Btn]│◄─┐│
│                                           │Edit Assi │  ││
│                                           └──────────┘  ││
└─────────────────────────────────────────────────────────┘│
                                                           │
          This is the "Sync to Ops-Sales" button ─────────┘
```

#### 2. Ticket Sales Roster View
**Navigation Path:** Dashboard → Sales Roster

```
┌─────────────────────────────────────────────────────────┐
│ Ticket Sales Roster for [Date]                          │
│ Present: 12  Absent: 2                                   │
├─────────────────────────────────────────────────────────┤
│                              ┌─────────┐  ┌──────────┐  │
│                              │ Date: ▼ │  │DL Attend │  │
│                              │Filter:▼ │  │DL Roster │  │
│                              └─────────┘  │DL Assign │  │
│                                           │[Sync Btn]│◄─┐│
│                                           └──────────┘  ││
└─────────────────────────────────────────────────────────┘│
                                                           │
          This is the "Sync to Ops-Sales" button ─────────┘
```

## Button Appearance

### When Ready to Sync
```
┌──────────────────────┐
│  Sync to Ops-Sales   │  ← Teal/Cyan color (#0d9488)
└──────────────────────┘
     [Hover effect: Darker teal]
```

### During Sync Operation
```
┌──────────────────────┐
│    Syncing...        │  ← Gray color (disabled state)
└──────────────────────┘
     [No hover effect]
```

### When Not Configured
```
     [Button is hidden]  ← Not visible until configured
```

## Button Behavior

### ✅ Normal State
- **Color:** Teal/Cyan (#0d9488)
- **Text:** "Sync to Ops-Sales"
- **Cursor:** Pointer (clickable)
- **Hover:** Darker teal (#0f766e)
- **Action:** Starts sync operation

### ⏳ Loading State
- **Color:** Gray (#6b7280)
- **Text:** "Syncing..."
- **Cursor:** Not allowed
- **Hover:** No effect
- **Action:** Disabled (cannot click)

### 🚫 Not Configured
- **Visibility:** Hidden
- **Reason:** TFW-ops-sales config not set up
- **Solution:** Configure `tfwOpsSalesConfig.ts`

## Notification Messages

### Success Message
```
┌────────────────────────────────────────────┐
│ ✓ Roster successfully synced to TFW-ops-  │
│   sales for 2024-01-15                     │
└────────────────────────────────────────────┘
```

### Error Messages
```
┌────────────────────────────────────────────┐
│ ✗ TFW-ops-sales database is not           │
│   configured. Please configure it in       │
│   tfwOpsSalesConfig.ts                     │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ ✗ Failed to sync roster: [error details]  │
└────────────────────────────────────────────┘
```

## Access Requirements

### Who Can See the Button?
✅ **Admin** - Full access  
✅ **Operation Officer** - Full access  
❌ **Operator** - No access (button hidden)  
❌ **Ticket Sales** - No access (button hidden)  
❌ **Sales Officer** - No access (button hidden)  

### Prerequisites for Button to Appear
1. ✅ Logged in as Admin or Operation Officer
2. ✅ On a roster view (Ops Roster or Sales Roster)
3. ✅ TFW-ops-sales configured in `tfwOpsSalesConfig.ts`

## Step-by-Step Usage

### Step 1: Navigate to Roster
```
Click: Dashboard → Ops Roster
   OR
Click: Dashboard → Sales Roster
```

### Step 2: Select Date
```
Use date picker to select the roster date you want to sync
```

### Step 3: Click Sync Button
```
Click the teal "Sync to Ops-Sales" button
```

### Step 4: Wait for Confirmation
```
Button shows "Syncing..." then returns to normal
Success notification appears at the top
```

## Visual Status Indicator

Check sync configuration in **Settings → Backup & Restore**:

```
┌────────────────────────────────────────────┐
│ TFW-ops-sales Database Sync                │
├────────────────────────────────────────────┤
│ ● Configured                               │◄── Green dot = Ready
│ Sync functionality is enabled. Use the     │
│ "Sync to Ops-Sales" button in roster      │
│ views to push roster data.                 │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ TFW-ops-sales Database Sync                │
├────────────────────────────────────────────┤
│ ● Not Configured                           │◄── Red dot = Needs setup
│ To enable sync, configure Firebase         │
│ credentials in tfwOpsSalesConfig.ts.       │
│ See SYNC_SETUP.md for details.            │
└────────────────────────────────────────────┘
```

## Button Positioning

### Desktop View (Wide Screen)
```
┌────────────────────────────────────────────────────────────┐
│  Roster Header                    [Date] [Buttons] [Sync] │
└────────────────────────────────────────────────────────────┘
                    Buttons are in top-right, grouped together
```

### Mobile View (Narrow Screen)
```
┌──────────────────────┐
│  Roster Header       │
│  [Date Picker]       │
│  [Download Buttons]  │
│  [Sync Button]       │
│  [Edit Button]       │
└──────────────────────┘
     Buttons stack vertically
```

## Color Palette Reference

| State | Color Code | Color Name | Description |
|-------|-----------|------------|-------------|
| Normal | #0d9488 | Teal-600 | Ready to sync |
| Hover | #0f766e | Teal-700 | Mouse over |
| Active | #115e59 | Teal-800 | Being clicked |
| Disabled | #6b7280 | Gray-500 | Currently syncing |
| Success | #10b981 | Green-500 | Notification |
| Error | #ef4444 | Red-500 | Notification |

## Troubleshooting Visual Issues

### Problem: Button Not Visible
**Check:**
1. ✅ Are you logged in as Admin or Operation Officer?
2. ✅ Are you on the Ops Roster or Sales Roster page?
3. ✅ Is tfwOpsSalesConfig.ts properly configured?
4. ✅ Did you rebuild the app after configuration?

### Problem: Button is Grayed Out
**Reason:** Sync is currently in progress
**Wait:** A few seconds for the operation to complete

### Problem: Button Appears but Sync Fails
**Check:**
1. ✅ Firebase credentials are correct
2. ✅ Firebase database exists
3. ✅ Database rules allow write access
4. ✅ Internet connection is active

---

## Quick Reference

| Element | Location | Action |
|---------|----------|--------|
| **Sync Button** | Top-right of roster views | Click to sync |
| **Status Indicator** | Settings → Backup & Restore | Check config |
| **Date Picker** | Next to sync button | Select roster date |
| **Notifications** | Top-center of screen | Shows sync result |

---

**Need Help?**
- 📖 Setup Guide: See `SYNC_SETUP.md`
- 🚀 Quick Start: See `SYNC_QUICK_START.md`
- 📋 Summary: See `IMPLEMENTATION_SUMMARY.md`
