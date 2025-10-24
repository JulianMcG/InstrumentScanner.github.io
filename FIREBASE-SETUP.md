# Firebase Setup Guide for Instrument Scanner

This guide will walk you through setting up Firebase for your Instrument Scanner app step by step.

## Step 1: Create a Firebase Project

1. **Go to Firebase Console**: Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. **Sign in** with your Google account
3. **Create New Project**:
   - Click "Create a project" or "Add project"
   - Enter project name: "Instrument Scanner" (or your preferred name)
   - Click "Continue"
   - **Disable Google Analytics** (optional, but recommended for simplicity)
   - Click "Create project"
   - Wait for the project to be created

## Step 2: Enable Authentication

1. **In Firebase Console**:
   - Click "Authentication" in the left sidebar
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Find "Google" in the list and click on it
   - Toggle "Enable" to ON
   - Set "Project support email" to your email
   - Click "Save"

## Step 3: Set Up Firestore Database

1. **Create Database**:
   - Click "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (we'll secure it later)
   - Click "Next"
   - Select a location close to your users (e.g., us-central1)
   - Click "Done"

## Step 4: Get Firebase Configuration

1. **Get Web App Config**:
   - Click the gear icon (⚙️) next to "Project Overview"
   - Select "Project settings"
   - Scroll down to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Enter app nickname: "Instrument Scanner Web"
   - **Check "Also set up Firebase Hosting"** (optional)
   - Click "Register app"
   - **Copy the Firebase configuration object** (it looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

## Step 5: Update Your App Configuration

1. **Open** `index.html` in your project
2. **Find** the Firebase configuration section (around line 291)
3. **Replace** the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

## Step 6: Set Up Firestore Security Rules

1. **Go to Firestore Database** in Firebase Console
2. **Click "Rules" tab**
3. **Replace the default rules** with these secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own profile
    match /userProfiles/{profileId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Users can only access their own instruments
    match /instruments/{instrumentId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

4. **Click "Publish"**

## Step 7: Test Your Setup

1. **Open your app** in a web browser
2. **You should see** the sign-in page
3. **Click "Sign in with Google"**
4. **Complete the profile setup** with your school identifier
5. **Test scanning** an item to make sure it saves to Firebase

## Step 8: Deploy Your App (Optional)

If you want to deploy your app to the web:

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**:
   ```bash
   firebase init hosting
   ```

4. **Deploy your app**:
   ```bash
   firebase deploy
   ```

## Troubleshooting

### Common Issues:

1. **"Firebase not defined" error**:
   - Make sure you've replaced the Firebase config with your actual values
   - Check that your Firebase project is properly set up

2. **"Permission denied" error**:
   - Make sure you've set up the Firestore security rules correctly
   - Check that the user is properly authenticated

3. **"Google sign-in not working"**:
   - Make sure Google authentication is enabled in Firebase Console
   - Check that your domain is added to authorized domains

4. **"Identifier already taken" error**:
   - This is working correctly! The app checks for duplicate identifiers
   - Try a different identifier

### Getting Help:

- Check the browser console for error messages
- Make sure all Firebase services are enabled
- Verify your Firebase configuration is correct

## What's New in Your App

Your app now has these new features:

1. **Google Sign-In**: Users must sign in with Google to use the app
2. **User Profiles**: Each user has a unique school/organization identifier
3. **Cloud Storage**: All data is stored in Firebase Firestore
4. **User Isolation**: Each user only sees their own instruments
5. **Real-time Updates**: Changes are automatically saved to the cloud
6. **Secure Access**: Only authenticated users can access the app

## Next Steps

Once everything is working:

1. **Test thoroughly** with multiple users
2. **Consider adding more features** like:
   - User management for administrators
   - Export/import functionality
   - Advanced reporting
   - Multi-school support

Your app is now a fully cloud-based, multi-user instrument management system!
