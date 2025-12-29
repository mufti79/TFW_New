<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1yXx0FlqI6tJ3MDON-_UrxBzJpJO01bHL

## Features

- **Ride Operations Management** - Track guest counts across all rides and attractions
- **Operator Roster System** - Manage operator assignments and attendance with real-time sync
- **Ticket Sales Tracking** - Monitor sales across multiple counters
- **Maintenance Dashboard** - Report and track maintenance issues
- **Shared Database** - TFW_New and TFW_OPS_Sales use the same Firebase database for data consistency
- **Manual Sync** - Refresh button to force reload latest data from database when needed

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
