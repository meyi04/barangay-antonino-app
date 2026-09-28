# Create a Barangay Antonino staff account

The app uses `admin` as the internal role name for barangay staff. Use the normal email/password login screen. No separate staff password or login URL is needed.

## Option A: promote your existing account
1. Register in the app if you do not already have an account.
2. Open Firebase Console and select project `antonino-cf44b`.
3. Open Authentication > Users. Find your email and copy its UID.
4. Open Firestore Database > Data > users > the document whose ID is that exact UID.
5. Set the `role` field (string) to `admin`, lowercase. Save. Do not use `staff`, because this app checks for `admin`.
6. Refresh the app, or sign out and sign in again with the same email and password. You should open the Staff Dashboard.

## Option B: create an account entirely in Firebase
1. In Authentication > Sign-in method, enable Email/Password if needed.
2. In Authentication > Users, choose Add user and enter an email and password. Copy the new UID.
3. In Firestore Database > Data, open/create the `users` collection and create a document with the UID as its document ID (not an auto-generated ID).
4. Add these string fields:

| Field | Value |
| --- | --- |
| uid | The exact Authentication UID |
| email | The email you created |
| fullName | The staff member's name |
| role | admin |
| purok | Purok 1 (or the correct purok; optional) |
| contactNumber | Their mobile number (optional) |

5. Sign in through the app. Passwords belong only in Firebase Authentication; do not add a password field to Firestore.

## Staff workspace
- Dashboard: live totals and shortcuts.
- Manage: search all resident submissions, open details, and change status to Pending, In Progress, or Resolved.
- Transparency: publish reports and attach PDF/JPG/PNG files; remove publications.
- Logout: return to the shared sign-in screen.

## Required Firestore access rules
Client-side roles select the interface. Deployed Firebase rules must enforce data permissions. Merge these blocks into your existing `/databases/{database}/documents` rules and remove any broader rule that grants unrestricted writes. Do not replace unrelated collection rules. Firebase Console changes are performed with your administrator privileges, so app users do not need permission to edit their own roles.

```text
function isBarangayStaff() {
  return request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
match /users/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow create: if request.auth != null && request.auth.uid == uid
    && request.resource.data.uid == uid
    && request.resource.data.role == 'resident';
  allow update: if request.auth != null && request.auth.uid == uid
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['fullName', 'purok', 'contactNumber']);
  allow delete: if false;
}
match /requests/{id} {
  allow read: if request.auth != null && (isBarangayStaff() || resource.data.submittedByUid == request.auth.uid);
  allow create: if request.auth != null
    && request.resource.data.submittedByUid == request.auth.uid
    && request.resource.data.status == 'Pending';
  allow update: if request.auth != null && (
    (isBarangayStaff()
      && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])
      && request.resource.data.status in ['Pending', 'In Progress', 'Resolved'])
    || (resource.data.submittedByUid == request.auth.uid
      && resource.data.status == 'Pending'
      && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['title', 'description']))
  );
  allow delete: if request.auth != null
    && resource.data.submittedByUid == request.auth.uid
    && resource.data.status == 'Pending';
}
```

Keep the Transparency Board rules from TRANSPARENCY_SETUP.md alongside these rules. Enable Storage and apply its rules for attachments. Rules provided here have not been deployed or emulator-tested.

If you still see the resident portal: verify the project, UID document ID, and exact lowercase `admin` value, then refresh. If the staff page opens but requests fail to load: verify Firestore rules allow staff reads across the requests collection. A Firestore document alone does not create login credentials; an Authentication account must also exist.

References:
- https://firebase.google.com/docs/auth/web/manage-users
- https://firebase.google.com/docs/firestore/solutions/role-based-access
