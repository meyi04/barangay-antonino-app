# Create a Barangay Antonino administrator account

The app uses `admin` as the internal role name for administrators. Use the normal email/password login screen. There is no admin option on public registration and no separate admin password or login URL.

## Option A: promote your existing account
1. Register in the app if you do not already have an account.
2. Open Firebase Console and select project `antonino-cf44b`.
3. Open Authentication > Users. Find your email and copy its UID.
4. Open Firestore Database > Data > users > the document whose ID is that exact UID.
5. Set the `role` field (string) to `admin`, lowercase. Save. Do not use `staff`, because this app checks for `admin`.
6. Refresh the app, or sign out and sign in again with the same email and password. You should open the Admin Dashboard.

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

## Admin workspace
- Dashboard: live request totals and shortcuts to administration features.
- Users: search resident and admin profiles and edit profile details. Remove resident accounts, including their Firebase Authentication login and chat history. Submitted requests are retained. Admin accounts cannot be removed here.
- Manage: search submissions, change status, add an optional service fee, and issue a branded PDF receipt. Residents can download active receipts; resolving a request removes its receipt from the resident view.
- Transparency: publish reports and attach PDF/JPG/PNG files; remove publications.
- Reports: filter collected request fees and download a financial report.
- Chat: read and reply to resident messages.
- Administrator roles must be added or changed directly in Firebase; the app does not expose role assignment.

## Deploy admin permissions and account removal
The client interface is not an authorization boundary. Deploy the reviewed `firestore.rules` in this repository; they allow admins to list users and update profile details, but prevent changing user roles through the app. Do not replace the rest of the rules with an older snippet.

## Receipt PDF storage in Firestore

Receipt PDFs are generated locally and saved as a base64 PDF data URL in each request's `receiptPdfData` field. The value is capped at 700 KB to leave room under Firestore's 1 MiB document limit. Residents download it directly from their request data; no Storage bucket or CORS setup is needed. Resolving the request clears the field.

Deploy the reviewed Firestore rules with:

```powershell
firebase deploy --only firestore:rules --project antonino-cf44b
```

These rules must be deployed for admin and request management features. Local rule changes do not affect the live project until deployed. The Transparency Board still uses Storage for its existing attachments.

Removing a resident account uses a role-checked Cloud Function to delete its Firebase Authentication login, user profile, and chat history. Deploy the function before using that action:

```powershell
firebase deploy --only functions:deleteResidentAccount --project antonino-cf44b
```

The function refuses to remove admins or the signed-in administrator. If account deletion succeeds but cleanup is interrupted, retry the removal to clean up remaining profile/chat data.

Keep the Transparency Board rules from TRANSPARENCY_SETUP.md alongside these rules. Enable Storage and apply its rules for attachments. Rules provided here have not been deployed or emulator-tested.

If you still see the resident portal: verify the project, UID document ID, and exact lowercase `admin` value, then refresh. If admin pages fail to load, deploy the current Firestore rules. A Firestore document alone does not create login credentials; an Authentication account must also exist.

References:
- https://firebase.google.com/docs/auth/web/manage-users
- https://firebase.google.com/docs/firestore/solutions/role-based-access
