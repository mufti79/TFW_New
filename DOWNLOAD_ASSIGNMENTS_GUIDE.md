# Download Assignments Guide

## Overview

The TFW_New application provides comprehensive download functionality for roster data, including the ability to download operator and sales personnel assignments. This guide explains how to use the "DL Assignments" feature.

## Available Download Options

For both **Operator Roster** and **Ticket Sales Roster**, managers have access to three download options:

1. **DL Attendance** - Downloads attendance report (who checked in, briefing status, times)
2. **DL Roster** - Downloads complete roster with assignments (personnel + their assigned locations)
3. **DL Assignments** - Downloads assignments only (rides/counters + assigned personnel)

## How to Download Assignments

### For Operator Roster (Rides & Games)

1. **Navigate to the Operator Roster**
   - Log in as Admin or Operation Officer
   - Go to the "Ops Roster" view from the dashboard
   
2. **Select the Date**
   - Use the date picker in the top right to select the date you want to download
   - The roster will update to show that date's assignments

3. **Click "DL Assignments"**
   - Look for the purple button labeled "DL Assignments" in the top right section
   - It's grouped with "DL Attendance" (green) and "DL Roster" (dark green)
   - Click the button to download

4. **File Downloaded**
   - A CSV file will be downloaded automatically
   - Filename format: `ToggiFunWorld_Assignments_YYYY-MM-DD.csv`
   - Contains two columns: "Ride Name" and "Operator Name(s)"

### For Ticket Sales Roster (Counters)

1. **Navigate to the Ticket Sales Roster**
   - Log in as Admin or Sales Officer
   - Go to the "Sales Roster" view from the dashboard
   
2. **Select the Date**
   - Use the date picker in the top right to select the date you want to download
   - The roster will update to show that date's assignments

3. **Click "DL Assignments"**
   - Look for the purple button labeled "DL Assignments" in the top right section
   - It's grouped with "DL Attendance" (green) and "DL Roster" (dark green)
   - Click the button to download

4. **File Downloaded**
   - A CSV file will be downloaded automatically
   - Filename format: `ToggiFunWorld_SalesAssignments_YYYY-MM-DD.csv`
   - Contains two columns: "Counter Name" and "Personnel Name(s)"

## CSV File Format

### Operator Assignments CSV

```csv
Ride Name,Operator Name(s)
"Bumper Cars","John Smith, Jane Doe"
"Ferris Wheel","Alice Johnson"
"Roller Coaster","Bob Wilson, Charlie Brown"
```

### Sales Assignments CSV

```csv
Counter Name,Personnel Name(s)
"Main Gate Counter","Sarah Lee, Mike Chen"
"Food Court Counter","Emma Davis"
"VIP Counter","James Taylor, Lisa Anderson"
```

## Important Notes

### Who Can Download?

- **Operator Assignments**: Admin and Operation Officer roles only
- **Sales Assignments**: Admin and Sales Officer roles only
- Regular operators and sales personnel cannot access these download buttons

### When No Assignments Exist

If you try to download assignments for a date that has no assignments:
- An alert will display: "No assignments to download for this date."
- No file will be downloaded
- You'll need to either:
  - Select a different date, or
  - Create assignments for that date using the "Edit Assignments" button

### Multiple Assignments

When a ride or counter has multiple people assigned:
- All names are listed in a single cell
- Names are separated by commas and spaces
- Example: "John Smith, Jane Doe, Bob Wilson"

## Using the Downloaded CSV

The downloaded CSV files can be:
- Opened in Microsoft Excel, Google Sheets, or any spreadsheet application
- Used for reporting and analysis
- Shared with other team members
- Imported into other systems
- Used as backup/archive of assignment history

## Troubleshooting

### Button Not Visible

**Problem**: I don't see the "DL Assignments" button  
**Solution**: 
- Verify you're logged in as Admin, Operation Officer, or Sales Officer
- Regular operators and sales personnel don't have access to these buttons
- Make sure you're on the correct roster view (Ops Roster or Sales Roster)

### Nothing Downloads When I Click

**Problem**: Button doesn't download anything  
**Solution**:
- Check if there are assignments for the selected date
- Look for an alert message about "No assignments to download"
- Try selecting a different date that has assignments
- Check your browser's download settings and permissions

### CSV File Won't Open

**Problem**: Downloaded file won't open properly  
**Solution**:
- Make sure you have a spreadsheet application installed (Excel, LibreOffice, Google Sheets)
- Try right-clicking the file and choosing "Open With" > your preferred spreadsheet app
- If data looks garbled, ensure your spreadsheet app is set to UTF-8 encoding

### Names with Commas

**Problem**: Names containing commas break into multiple columns  
**Solution**:
- The CSV properly escapes names with quotes
- If you see issues, ensure you're opening with a proper CSV parser
- In Excel, use "Data" > "From Text/CSV" instead of direct double-click

## Additional Features

### Sync Button

Before downloading, you can use the **Sync** button (cyan/teal colored) to ensure you have the latest data from the database.

### Edit Assignments

To modify assignments before downloading:
1. Click the "Edit Assignments" button (blue)
2. Make your changes in the assignment editor
3. Save your changes
4. Return to the roster view
5. Download the updated assignments

## Related Documentation

- See `IMPLEMENTATION_SUMMARY.md` for technical details about the database structure
- See `README.md` for general setup and running instructions

## Support

If you encounter issues with the download functionality:
1. Verify your role/permissions
2. Check browser console for any error messages
3. Ensure you have the latest version of the application
4. Contact the development team with specific error details

---

**Last Updated**: December 29, 2024  
**Feature Status**: ✅ Fully Functional  
**Applies to**: TFW_New Operator and Sales Roster modules
