# TFW-ops-sales Database Sync Setup

This document explains how to configure the sync feature between TFW_New and TFW-ops-sales databases.

## Overview

The TFW_New application now includes a sync feature that allows you to push roster data (operator assignments and attendance) to a separate TFW-ops-sales Firebase database. This enables the TFW-ops-sales application to access roster information without directly connecting to the TFW_New database.

## Configuration Steps

### 1. Create or Access TFW-ops-sales Firebase Project

If you haven't already:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project for TFW-ops-sales (or use an existing one)
3. Create a Realtime Database in your Firebase project
4. Set up appropriate security rules for your database

### 2. Get Firebase Configuration

1. In your Firebase project console, go to Project Settings
2. Under "Your apps", find your web app or create a new one
3. Copy the Firebase configuration object (it looks like this):

```javascript
{
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

### 3. Update Configuration File

1. Open `tfwOpsSalesConfig.ts` in the root directory
2. Replace the placeholder values with your actual Firebase configuration:

```typescript
const tfwOpsSalesConfig = {
  apiKey: "YOUR_TFW_OPS_SALES_API_KEY",          // Replace this
  authDomain: "YOUR_TFW_OPS_SALES_AUTH_DOMAIN",  // Replace this
  databaseURL: "YOUR_TFW_OPS_SALES_DATABASE_URL", // Replace this (important!)
  projectId: "YOUR_TFW_OPS_SALES_PROJECT_ID",    // Replace this
  storageBucket: "YOUR_TFW_OPS_SALES_STORAGE_BUCKET", // Replace this
  messagingSenderId: "YOUR_TFW_OPS_SALES_MESSAGING_SENDER_ID", // Replace this
  appId: "YOUR_TFW_OPS_SALES_APP_ID"             // Replace this
};
```

3. Save the file

### 4. Firebase Security Rules (Important!)

In your TFW-ops-sales Firebase Realtime Database, set up security rules to control access. Example:

```json
{
  "rules": {
    "synced": {
      ".read": true,
      ".write": true
    }
  }
}
```

**Note:** Adjust these rules based on your security requirements. For production, you should implement proper authentication and authorization.

## How to Use the Sync Feature

### For Admin/Operation Officers:

1. **Navigate to the Roster View:**
   - For operator roster: Click "Ops Roster" in the navigation menu
   - For ticket sales roster: Click "Sales Roster" in the navigation menu

2. **Select the Date:**
   - Use the date picker to select the roster date you want to sync

3. **Click the Sync Button:**
   - Look for the "Sync to Ops-Sales" button (teal/cyan colored)
   - Click it to sync the current roster to TFW-ops-sales database
   - You'll see a notification indicating success or failure

### What Gets Synced:

The sync operation pushes the following data to TFW-ops-sales:

1. **Date** - The roster date
2. **Type** - Either 'operator' or 'ticket-sales'
3. **Assignments** - Complete assignment mapping (ride/counter IDs to operator/personnel IDs)
4. **Operators/Personnel** - List of all operators/personnel with their IDs and names
5. **Attendance** - Attendance records for the date (check-in status, briefing attendance, briefing time)
6. **Timestamp** - When the sync occurred

### Data Structure in TFW-ops-sales:

The synced data is stored in the following paths:

```
/synced/operatorRoster/{date}
  - date
  - type: 'operator'
  - timestamp
  - assignments: { rideId: [operatorIds] }
  - operators: [{ id, name }]
  - attendance: [{ operatorId, attendedBriefing, briefingTime }]

/synced/ticketSalesRoster/{date}
  - date
  - type: 'ticket-sales'
  - timestamp
  - assignments: { counterId: [personnelIds] }
  - operators: [{ id, name }]
  - attendance: [{ operatorId, attendedBriefing, briefingTime }]

/synced/lastSync
  - operator: { date, timestamp, status }
  - ticket-sales: { date, timestamp, status }
```

## Accessing Synced Data in TFW-ops-sales

In your TFW-ops-sales application, you can read the synced data using Firebase Realtime Database queries:

```javascript
// Example: Read operator roster for a specific date
firebase.database().ref('synced/operatorRoster/2024-01-15').once('value')
  .then(snapshot => {
    const rosterData = snapshot.val();
    console.log('Assignments:', rosterData.assignments);
    console.log('Operators:', rosterData.operators);
    console.log('Attendance:', rosterData.attendance);
  });

// Example: Check last sync status
firebase.database().ref('synced/lastSync/operator').once('value')
  .then(snapshot => {
    const lastSync = snapshot.val();
    console.log('Last synced date:', lastSync.date);
    console.log('Last sync time:', lastSync.timestamp);
  });
```

## Troubleshooting

### Sync Button Not Visible
- Make sure you've configured the Firebase credentials in `tfwOpsSalesConfig.ts`
- Check that you're logged in as an admin or operation officer
- Verify you're on the correct roster view

### Sync Fails with Error
- Check your Firebase configuration is correct
- Verify the TFW-ops-sales database exists and is accessible
- Check Firebase security rules allow write access
- Look at browser console for detailed error messages

### Data Not Appearing in TFW-ops-sales
- Verify the sync operation completed successfully (check for success notification)
- Use Firebase Console to inspect the database directly
- Check the `/synced/lastSync` path to see the last successful sync timestamp

## Security Considerations

1. **Never commit Firebase credentials to public repositories**
2. Configure proper Firebase security rules based on your needs
3. Consider implementing authentication for write operations
4. Use environment variables for sensitive configuration in production
5. Regularly audit who has access to both databases

## Support

If you encounter issues with the sync feature, please check:
1. Browser console for error messages
2. Firebase Console for database access issues
3. Network tab in browser dev tools for failed requests

For additional help, contact your system administrator or development team.
