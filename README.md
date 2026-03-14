
# Smart Clean SaaS CRM Setup Guide

A modern, multi-tenant CRM platform for cleaning companies built with Next.js 15, Tailwind CSS, and Firebase.

## 🚀 Accessing the Admin Dashboard

The CRM portal is located at `/admin/dashboard`. To log in with your credentials (`smartclean422@gmail.com` / `admin123`), you MUST complete these steps in the Firebase Console:

### 1. Enable Authentication & Whitelist Domain
- Go to [Firebase Console](https://console.firebase.com/).
- Navigate to **Build > Authentication**.
- Go to the **Sign-in method** tab and enable **Email/Password**.
- Go to the **Settings** tab (within Authentication), then **Authorized domains**.
- Click **Add domain** and paste your current application's domain (e.g., the URL in your browser address bar without the path). This fixes the `auth/network-request-failed` error.

### 2. Create your User account
- In the **Authentication > Users** tab, click **Add user**.
- Email: `smartclean422@gmail.com`
- Password: `admin123`
- Click **Add user**.
- **COPY THE UID** generated for this user. If it matches `gcp03WmpjROVvRdpLNsghNU4zHa2`, you have instant access!

### 3. (Optional but Recommended) Grant Admin Rights in Firestore
- Go to **Build > Firestore Database**.
- Create a collection named `roles_admins`.
- Create a new document where the **Document ID** is your UID: `gcp03WmpjROVvRdpLNsghNU4zHa2`.
- You can leave the fields empty.

### 4. Access the Dashboard
- Go to `/login` in your app.
- Enter your email and password.
- You will be redirected to the Dashboard.
- **NOTE**: The code includes a "bootstrap" bypass for UID `gcp03WmpjROVvRdpLNsghNU4zHa2`.

## Features
- **Leads & Bookings**: Full tracking of sales and appointments.
- **Staff Management**: Performance metrics and job assignments.
- **Seed Utility**: Click "Seed Database" in the dashboard to populate with sample data.
