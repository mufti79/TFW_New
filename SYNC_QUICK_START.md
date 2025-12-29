# TFW-ops-sales Sync Feature - Quick Start Guide

## What This Feature Does

This feature allows administrators and operation officers to sync roster data from **TFW_New** to a separate **TFW-ops-sales** Firebase database with a single button click. This enables the TFW-ops-sales application to access up-to-date roster information without directly connecting to the TFW_New database.

## Key Benefits

✅ **One-Click Sync** - Sync roster data instantly with a single button  
✅ **Separate Databases** - Keep TFW_New and TFW-ops-sales databases independent  
✅ **Comprehensive Data** - Syncs assignments, attendance, and operator information  
✅ **Real-Time Updates** - Sync whenever roster changes occur  
✅ **Two-Way Flexibility** - Sync both operator rosters and ticket sales rosters

## Quick Setup (5 Minutes)

### Step 1: Get Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open your TFW-ops-sales project (or create a new one)
3. Click ⚙️ Settings → Project Settings
4. Scroll to "Your apps" section
5. Copy the Firebase configuration object

### Step 2: Configure TFW_New
1. Open `tfwOpsSalesConfig.ts` in the project root
2. Replace the placeholder values with your Firebase config
3. Save the file

### Step 3: Set Database Rules
In your TFW-ops-sales Firebase Console:
1. Go to Realtime Database
2. Click "Rules" tab
3. Add rules to allow write access (see SYNC_SETUP.md for examples)

### Step 4: Start Using!
1. Build and deploy your app: `npm run build`
2. Log in as Admin or Operation Officer
3. Navigate to any roster view
4. Look for the **"Sync to Ops-Sales"** button (teal/cyan color)
5. Click to sync!

## Where to Find the Sync Button

### For Operator Rosters:
- Navigate to: **Ops Roster** (in main navigation)
- Look for: Button in the top-right control panel
- Button text: "Sync to Ops-Sales"
- Color: Teal/Cyan

### For Ticket Sales Rosters:
- Navigate to: **Sales Roster** (in main navigation)
- Look for: Button in the top-right control panel
- Button text: "Sync to Ops-Sales"
- Color: Teal/Cyan

## What Gets Synced

When you click the sync button, the following data is pushed to TFW-ops-sales:

📅 **Date** - The roster date  
👥 **Operators/Personnel** - Full list with IDs and names  
🎯 **Assignments** - Complete ride/counter assignments  
✅ **Attendance** - Check-in status and briefing information  
⏰ **Timestamp** - When the sync occurred

## Checking Sync Status

### In the App:
1. Click **⚙️ Settings** or **Backup & Restore** in the menu
2. Look for the **"TFW-ops-sales Database Sync"** section
3. Check the status indicator:
   - 🟢 Green = Configured and ready
   - 🔴 Red = Not configured yet

### After Syncing:
- You'll see a **success notification** at the top of the screen
- The button briefly shows "Syncing..." during the operation
- Any errors will be displayed as error notifications

## Accessing Synced Data in TFW-ops-sales

The synced data is stored in your TFW-ops-sales database at:

```
/synced/operatorRoster/{date}     ← Operator rosters
/synced/ticketSalesRoster/{date}  ← Ticket sales rosters
/synced/lastSync                  ← Last sync timestamps
```

Example: Reading synced data in your TFW-ops-sales app:

```javascript
// Read operator roster for a specific date
const date = '2024-01-15';
firebase.database()
  .ref(`synced/operatorRoster/${date}`)
  .once('value')
  .then(snapshot => {
    const roster = snapshot.val();
    console.log('Assignments:', roster.assignments);
    console.log('Operators:', roster.operators);
    console.log('Attendance:', roster.attendance);
  });
```

## Troubleshooting

### ❌ Sync Button Not Showing
**Problem:** You don't see the "Sync to Ops-Sales" button  
**Solution:**
- Make sure you're logged in as Admin or Operation Officer
- Check that you've configured `tfwOpsSalesConfig.ts` with valid credentials
- Verify you're on the correct roster view (Ops Roster or Sales Roster)

### ❌ Sync Fails with Error
**Problem:** You see an error notification when clicking sync  
**Solution:**
- Check your Firebase credentials in `tfwOpsSalesConfig.ts`
- Verify the TFW-ops-sales database exists in Firebase Console
- Check Firebase security rules allow write access
- Open browser console (F12) for detailed error messages

### ❌ Data Not Appearing in TFW-ops-sales
**Problem:** Sync succeeds but data doesn't show up  
**Solution:**
- Go to Firebase Console → Realtime Database
- Navigate to `/synced/operatorRoster/` or `/synced/ticketSalesRoster/`
- Verify the data is present
- Check `/synced/lastSync` to see the last sync timestamp

### ⚠️ Configuration Status Shows Red
**Problem:** Status indicator in Backup & Restore shows "Not Configured"  
**Solution:**
- Open `tfwOpsSalesConfig.ts`
- Make sure ALL placeholder values are replaced with actual Firebase credentials
- Especially check: `projectId`, `apiKey`, and `databaseURL`
- Save the file and rebuild the app

## Best Practices

✅ **Sync Regularly** - Sync rosters whenever assignments change  
✅ **Verify After Sync** - Check the success notification appears  
✅ **Test Database Access** - Use Firebase Console to verify data structure  
✅ **Secure Your Database** - Use proper Firebase security rules in production  
✅ **Keep Backups** - Use the existing backup feature as a safety net

## Need More Help?

📖 **Detailed Documentation:** See `SYNC_SETUP.md` for comprehensive setup instructions  
🔧 **Configuration File:** Edit `tfwOpsSalesConfig.ts` to configure sync  
🛠️ **Sync Logic:** Check `syncUtils.ts` for the implementation details  
🌐 **Firebase Console:** [https://console.firebase.google.com/](https://console.firebase.google.com/)

## Feature Summary

| Feature | Details |
|---------|---------|
| **Button Location** | Top-right of roster views |
| **Access Level** | Admin, Operation Officer |
| **Sync Types** | Operator Roster, Ticket Sales Roster |
| **Data Synced** | Assignments, Attendance, Operator Info |
| **Sync Direction** | TFW_New → TFW-ops-sales |
| **Database Type** | Firebase Realtime Database |
| **Setup Time** | ~5 minutes |

---

**Ready to get started?** Follow the Quick Setup steps above, and you'll be syncing rosters in minutes! 🚀
