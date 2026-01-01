// @ts-nocheck
// This comment is to suppress TypeScript errors in a file that uses a global `firebase` object.

// IMPORTANT:
// This is the SHARED Firebase configuration used by both TFW_New and TFW-OPS-Sales.
// Both applications use the SAME Firebase database.
// 
// To configure this app:
// 1. Use the shared Firebase project (TFW-OPS-Sales database, or create one if it doesn't exist)
// 2. In your Firebase project, create a new Web App if needed
// 3. Copy the firebaseConfig object provided by Firebase
// 4. Paste it here, replacing the configuration below
// 5. In your Firebase project, go to "Realtime Database" and create one if needed
//    - Make sure to set the security rules to allow read/write for development:
//      {
//        "rules": {
//          ".read": "true",
//          ".write": "true"
//        }
//      }
//
// NOTE: Both TFW_New and TFW-OPS-Sales applications should use the same credentials.
// There is only ONE shared database for both applications.

// Shared Firebase configuration for both TFW_New and TFW-OPS-Sales
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqOf6utAgmO-NXqbPTnBO3BdD7yCUBbW8",
  authDomain: "toggifunworld-app.firebaseapp.com",
  databaseURL: "https://toggifunworld-app-default-rtdb.firebaseio.com",
  projectId: "toggifunworld-app",
  storageBucket: "toggifunworld-app.firebasestorage.app",
  messagingSenderId: "718439883778",
  appId: "1:718439883778:web:6f3ad4977156ab37e7f31b"
};


// Check if the config has been filled out. This logic is used in App.tsx
// to show a configuration help screen.
export const isFirebaseConfigured = firebaseConfig.projectId !== "YOUR_PROJECT_ID" && firebaseConfig.apiKey !== "YOUR_API_KEY";

// Initialize Firebase only if it's configured and not already initialized.
// It uses the global `firebase` object from the script tags in index.html.
let database: firebase.database.Database | null = null;
let initializationAttempted = false;

// Function to initialize Firebase, called after ensuring scripts are loaded
function initializeFirebase() {
  if (initializationAttempted) {
    return database;
  }
  
  initializationAttempted = true;
  
  if (!isFirebaseConfigured) {
    console.warn('Firebase is not configured');
    return null;
  }

  try {
    // Check if firebase global object exists
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK not loaded. Make sure script tags are in index.html');
      return null;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    }
    database = firebase.database();
    return database;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    database = null;
    return null;
  }
}

// Try to initialize immediately if firebase is already available
if (isFirebaseConfigured && typeof firebase !== 'undefined') {
  initializeFirebase();
}

// Function to get database instance, initializing if needed
export function getDatabase(): firebase.database.Database | null {
  if (database) {
    return database;
  }
  return initializeFirebase();
}
