# SPEC-05: Security Rules

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users — own profile only
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Lists — member-based access
    match /lists/{listId} {
      allow read: if request.auth != null
        && request.auth.uid in resource.data.members.keys();
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
        && resource.data.members[request.auth.uid] == 'owner';

      // Items — owners and editors can write
      match /items/{itemId} {
        allow read: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/lists/$(listId)).data.members.keys();
        allow write: if request.auth != null
          && get(/databases/$(database)/documents/lists/$(listId)).data.members[request.auth.uid] in ['owner', 'editor'];
      }

      // Activity log — append-only for members
      match /activity/{eventId} {
        allow read: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/lists/$(listId)).data.members.keys();
        allow create: if request.auth != null
          && request.auth.uid in get(/databases/$(database)/documents/lists/$(listId)).data.members.keys();
        allow delete: if false;
      }
    }

    // Pantry — owner only
    match /pantry/{uid}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Insights — owner only
    match /insights/{uid}/tips/{tipId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Environment Variables

```env
NVIDIA_API_KEY=               # Required — NVIDIA NIM API key
VITE_FIREBASE_API_KEY=        # Required
VITE_FIREBASE_AUTH_DOMAIN=    # Required
VITE_FIREBASE_PROJECT_ID=     # Required
VITE_FIREBASE_STORAGE_BUCKET= # Required
VITE_FIREBASE_MESSAGING_SENDER_ID= # Required
VITE_FIREBASE_APP_ID=         # Required
```
