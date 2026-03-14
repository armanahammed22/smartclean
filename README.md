
# Smart Clean SaaS CRM Setup Guide

A modern, multi-tenant CRM platform for cleaning companies built with Next.js 15, Tailwind CSS, and Firebase.

## 🚀 How to Access the Admin Dashboard

The CRM portal is located at `/admin/dashboard`. To log in with your credentials (`smartclean422@gmail.com` / `admin123`), follow these mandatory steps in the Firebase Console:

### 1. Enable Authentication
- Go to [Firebase Console](https://console.firebase.com/).
- Navigate to **Build > Authentication**.
- Go to the **Sign-in method** tab.
- Click **Add new provider** and enable **Email/Password**.

### 2. Create your User account
- In the **Authentication > Users** tab, click **Add user**.
- Email: `smartclean422@gmail.com`
- Password: `admin123`
- Click **Add user**.
- **COPY THE UID** generated for this user (it should be: `28N2Dy4D9mPF1fX5p9A6OZQVY0A2`).

### 3. Grant Administrator Privileges (Firestore)
- Go to **Build > Firestore Database**.
- Click **Start collection** (if your DB is empty) or click your existing database.
- Create a collection named `roles_admins`.
- **CRITICAL**: Create a new document where the **Document ID** is exactly your UID: `28N2Dy4D9mPF1fX5p9A6OZQVY0A2`.
- You can leave the fields empty. Save the document.

### 4. Login
- Go to `/login` in your app.
- Enter your email and password.
- You will be redirected to the Admin Dashboard.
- Click **"Seed Database"** in the top right to populate the CRM with sample data!

## Key Features
- **Multi-tenant Leads**: Track sales opportunities across different sources.
- **Service Workflow**: Assign employees and track cleaning progress.
- **Analytics**: Revenue forecasting and employee performance metrics.
- **SaaS Ready**: Structure built for company isolation and role-based access.
