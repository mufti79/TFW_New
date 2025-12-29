// @ts-nocheck
// Configuration for TFW-ops-sales database sync

// ===================================================================
// IMPORTANT: CONFIGURE THIS FILE TO ENABLE SYNC FUNCTIONALITY
// ===================================================================
// This file contains Firebase configuration for the TFW-ops-sales database.
// To enable roster syncing to TFW-ops-sales:
// 1. Create a Firebase project for TFW-ops-sales (or use existing one)
// 2. Get your Firebase configuration from the Firebase Console
// 3. Replace the placeholder values below with your actual credentials
// 4. See SYNC_SETUP.md for detailed setup instructions
// ===================================================================

// TFW-ops-sales Firebase configuration
// This is a separate Firebase database for the TFW-ops-sales application
// Replace with actual TFW-ops-sales Firebase credentials
const tfwOpsSalesConfig = {
  apiKey: "YOUR_TFW_OPS_SALES_API_KEY",
  authDomain: "YOUR_TFW_OPS_SALES_AUTH_DOMAIN",
  databaseURL: "YOUR_TFW_OPS_SALES_DATABASE_URL", // IMPORTANT: Must include database URL!
  projectId: "YOUR_TFW_OPS_SALES_PROJECT_ID",
  storageBucket: "YOUR_TFW_OPS_SALES_STORAGE_BUCKET",
  messagingSenderId: "YOUR_TFW_OPS_SALES_MESSAGING_SENDER_ID",
  appId: "YOUR_TFW_OPS_SALES_APP_ID"
};

// Check if the TFW-ops-sales config has been filled out
export const isTfwOpsSalesConfigured = 
  tfwOpsSalesConfig.projectId !== "YOUR_TFW_OPS_SALES_PROJECT_ID" && 
  tfwOpsSalesConfig.apiKey !== "YOUR_TFW_OPS_SALES_API_KEY";

// Initialize TFW-ops-sales Firebase app
let tfwOpsSalesApp = null;
let tfwOpsSalesDatabase = null;

if (isTfwOpsSalesConfigured && typeof firebase !== 'undefined') {
  try {
    // Initialize as a separate Firebase app instance
    tfwOpsSalesApp = firebase.initializeApp(tfwOpsSalesConfig, 'tfwOpsSales');
    tfwOpsSalesDatabase = tfwOpsSalesApp.database();
  } catch (error) {
    console.error('Failed to initialize TFW-ops-sales Firebase:', error);
  }
}

export { tfwOpsSalesDatabase, tfwOpsSalesApp };
