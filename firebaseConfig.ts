// @ts-nocheck
// This comment is to suppress TypeScript errors in a file that uses a global `firebase` object.

// IMPORTANT:
// This is the SHARED Firebase configuration used by both TFW_New and TFW-OPS-Sales.
// Both applications use the SAME Firebase database (TFW-OPS-Sales database).
// 
// To configure this app:
// 1. Use the Firebase project from TFW-OPS-Sales (or create one if it doesn't exist)
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
// NOTE: This configuration should match the TFW-OPS-Sales database credentials.
// There is only ONE database shared between both applications.

// Shared Firebase configuration (TFW-OPS-Sales database)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqOf6utAgmO-NXqbPTnBO3BdD7yCUBbW8",
  authDomain: "toggifunworld-app.firebaseapp.com",
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
if (isFirebaseConfigured && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export the database instance.
// If not configured, this will be null. App.tsx handles this by showing an error screen
// and preventing the execution of code that would use `database`.
export const database = isFirebaseConfigured ? firebase.database() : null;
