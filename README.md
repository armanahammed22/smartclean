# Smart Clean SaaS CRM

A modern, multi-tenant CRM platform for cleaning companies built with Next.js 15, Tailwind CSS, and Firebase.

## How to Access the Admin CRM Dashboard

The CRM portal is located at `/admin/dashboard`. For security, it requires an authenticated user with administrative privileges.

### Setup Instructions for your UID:

1.  **Authentication Setup**:
    - Go to your [Firebase Console](https://console.firebase.com/).
    - Select your project.
    - Go to **Build > Authentication**.
    - If not already done, create your account (or find your existing user).
    - Your UID is confirmed as: `28N2Dy4D9mPF1fX5p9A6OZQVY0A2`

2.  **Role Assignment (DBAC)**:
    - Go to **Build > Firestore Database**.
    - Create a collection named `roles_admins`.
    - Create a new document in this collection.
    - **Crucial**: Set the **Document ID** to your UID: `28N2Dy4D9mPF1fX5p9A6OZQVY0A2`
    - Save the document (it can be empty).

3.  **Sign In**:
    - Navigate to `/login` in your application.
    - Enter the email and password you created.
    - You will be redirected to the Admin Dashboard.

4.  **Seed Data**:
    - Once inside the dashboard, look for the **"Seed Database"** button in the top right. Click it to populate the CRM with sample leads, bookings, and employees.

## Key Features
- **Sales Leads**: Track and manage potential customers.
- **Booking Management**: Schedule and assign cleaning jobs.
- **Employee Directory**: Manage staff profiles and performance.
- **Analytics**: Real-time revenue and lead tracking.
