# Smart Clean SaaS CRM

A modern, multi-tenant CRM platform for cleaning companies built with Next.js 15, Tailwind CSS, and Firebase.

## How to Access the Admin CRM Dashboard

The CRM portal is located at `/admin/dashboard`. For security, it requires an authenticated user with administrative privileges.

### Setup Instructions:

1.  **Authentication Setup**:
    - Go to your [Firebase Console](https://console.firebase.google.com/).
    - Select your project.
    - Go to **Build > Authentication**.
    - Click **Add User** and create an account with an email and password.
    - Copy the **User UID** for this new user.

2.  **Role Assignment (DBAC)**:
    - Go to **Build > Firestore Database**.
    - Create a collection named `roles_admins`.
    - Create a new document in this collection.
    - **Crucial**: Set the **Document ID** to the **User UID** you copied in the previous step.
    - Save the document (it can be empty).

3.  **Sign In**:
    - Navigate to `/login` in your application.
    - Enter the email and password you created.
    - You will be redirected to the Admin Dashboard.

## Key Features
- **Sales Leads**: Track and manage potential customers.
- **Booking Management**: Schedule and assign cleaning jobs.
- **Employee Directory**: Manage staff profiles and performance.
- **Analytics**: Real-time revenue and lead tracking.
