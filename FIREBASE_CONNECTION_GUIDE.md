# Firebase Connection and Assignment Roster Guide

## Overview

This application uses Firebase Realtime Database to store and sync data between TFW_New and TFW-OPS-Sales applications. This guide explains how the Firebase connection works and how to save assignment rosters.

## Firebase Connection Status

### Visual Indicators

The application now provides multiple visual indicators showing the Firebase connection status:

#### 1. Header Status Indicator
- **Location**: Top-right corner of the header (on desktop) or in mobile menu
- **Display**: Small colored dot with status text
  - 🟢 **Green**: Connected - Real-time sync active
  - 🟡 **Yellow (pulsing)**: Connecting to Firebase...
  - 🔴 **Red (pulsing)**: Disconnected - Changes will not be saved

#### 2. Top Banner (When Not Connected)
- **Location**: Immediately below the header
- **Display**: Full-width prominent banner that appears only when Firebase is NOT connected
- **Shows**: Clear message about connection status with colored badge
- **Purpose**: Alerts users immediately if they lose connection to prevent data loss

#### 3. Assignment View Status Badge
- **Location**: At the top of both Assignment views (Operator Assignments and Ticket Sales Assignments)
- **Display**: Large colored badge with detailed status message
- **Shows**: Current Firebase connection state
- **Purpose**: Reminds users of connection status when working with critical data

### Connection States Explained

#### Connected (Green)
- ✅ Firebase Realtime Database is connected
- ✅ All changes are automatically synced
- ✅ Data is saved immediately
- ✅ Changes visible to all users in real-time

#### Connecting (Yellow)
- ⏳ Attempting to establish connection to Firebase
- ⏳ Wait a few seconds for connection to complete
- ⏳ If stuck, check your internet connection

#### Disconnected (Red)
- ❌ No connection to Firebase
- ❌ Changes will NOT be saved
- ❌ Cannot view or edit assignments
- ❌ Check your internet connection and refresh the page

## Saving Assignment Rosters

### How Assignment Saving Works

#### 1. Firebase Real-time Sync
- All assignment data is stored in Firebase Realtime Database
- The database path structure:
  ```
  /data/operatorAssignments/{date}/{rideId}: [operatorIds]
  /data/ticketSalesAssignments/{date}/{counterId}: [personnelIds]
  ```

#### 2. Assignment Views

**Operator Assignments** (for ride operations):
- Navigate to: **Ops Roster** → **Assignments** (or directly via navigation)
- Select date to view/edit assignments
- Assign operators to rides using dropdown checkboxes
- Click **Save Changes** button (only enabled when connected)

**Ticket Sales Assignments** (for sales counters):
- Navigate to: **Sales Roster** → **Assignments**
- Select date to view/edit assignments
- Assign sales personnel to counters using dropdown checkboxes
- Click **Save Changes** button (only enabled when connected)

#### 3. Save Button Behavior

The Save button has three states:

1. **"Save Changes" (Yellow, Pulsing)**
   - Appears when you have unsaved changes
   - Button is active and clickable
   - Click to save assignments to Firebase

2. **"All Saved" (Green, Dimmed)**
   - Appears when all changes are saved
   - No pending changes
   - Button is disabled (no action needed)

3. **"No Connection" (Gray, Disabled)**
   - Appears when Firebase is disconnected
   - Button is disabled to prevent data loss
   - Restore internet connection to enable saving

### Features

#### Import Assignments
- Click **Import** button
- Upload Excel (.xlsx, .xls) or CSV file
- File format:
  ```
  Ride Name/Counter Name, Operator/Personnel Name(s)
  Pirate Ship, John Doe, Jane Smith
  Roller Coaster, Bob Wilson
  ```

#### Export Assignments
- Click **Export** button
- Downloads CSV file with current assignments
- Use this file to:
  - Backup assignments
  - Share with TFW-OPS-Sales
  - Import into another date

#### Copy from Date
- Click **Copy from Date** button
- Enter source date (YYYY-MM-DD format)
- Merges assignments from that date into current date
- Remember to click **Save Changes** after copying

#### Clear All
- Click **Clear All** button
- Removes all assignments for the selected date
- Automatically saves the cleared state to Firebase
- Use with caution - cannot be undone!

## Database Configuration

### Shared Database
Both TFW_New and TFW-OPS-Sales use the **same Firebase database**:

**Configuration File**: `firebaseConfig.ts`
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAqOf6utAgmO-NXqbPTnBO3BdD7yCUBbW8",
  authDomain: "toggifunworld-app.firebaseapp.com",
  databaseURL: "https://toggifunworld-app-default-rtdb.firebaseio.com",
  projectId: "toggifunworld-app",
  storageBucket: "toggifunworld-app.firebasestorage.app",
  messagingSenderId: "718439883778",
  appId: "1:718439883778:web:6f3ad4977156ab37e7f31b"
};
```

### Database Structure
```
/data
  /operatorAssignments
    /{date}
      /{rideId}: [operatorId1, operatorId2, ...]
  /ticketSalesAssignments
    /{date}
      /{counterId}: [personnelId1, personnelId2, ...]
  /attendance
    /{date}
      /{operatorId}: { attendedBriefing, briefingTime }
  /dailyCounts
    /{date}
      /{rideId}: count
  /ticketSalesData
    /{date}
      /{counterId}: sales
```

## Troubleshooting

### Connection Issues

**Problem**: Status shows "Disconnected"
**Solutions**:
1. Check your internet connection
2. Refresh the page (F5 or Ctrl+R)
3. Clear browser cache and reload
4. Check if Firebase is down (rare)

**Problem**: Status stuck on "Connecting"
**Solutions**:
1. Wait 10-15 seconds
2. Check firewall or network restrictions
3. Refresh the page
4. Try a different browser

### Assignment Saving Issues

**Problem**: Changes not saved after clicking "Save Changes"
**Solutions**:
1. Check Firebase connection status (must be green)
2. Look for error notifications at bottom of screen
3. Try clicking "Save Changes" again
4. Export assignments as backup, then refresh page

**Problem**: Assignments disappear after logout
**Solutions**:
1. Verify you clicked "Save Changes" before logout
2. Check if connection was active when you saved
3. Look for the "All Saved" green button confirmation
4. Import from backup file if available

## Best Practices

### When Working with Assignments

1. **Always check connection status** before starting
2. **Save frequently** - click "Save Changes" after each batch of edits
3. **Wait for "All Saved" confirmation** before moving to another page
4. **Export regularly** to create backups
5. **Test connection** by making a small change and saving

### For Syncing Between Apps

1. **Export from one app** (TFW_New or TFW-OPS-Sales)
2. **Import into the other app**
3. **Click "Save Changes"** to persist to Firebase
4. **Verify sync** by checking data in both apps

### Data Safety

1. **Use "Export" before major changes** to create backups
2. **Don't use "Clear All" unless absolutely necessary**
3. **Keep exported CSV files** for historical records
4. **Document date ranges** when copying assignments

## Summary

✅ **Firebase Connection**: Always visible in multiple locations
✅ **Save Button**: Only works when connected (green status)
✅ **Real-time Sync**: Changes sync immediately across all apps
✅ **Backup Options**: Export/Import for data safety
✅ **Shared Database**: Same data in TFW_New and TFW-OPS-Sales

For additional support, contact the system administrator.
