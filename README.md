# Smart Clean SaaS CRM Setup Guide

A modern, multi-tenant CRM platform for cleaning companies built with Next.js 15, Tailwind CSS, and Firebase.

## 🖼️ Image Dimension Guide (ইমেজ সাইজ গাইড)

অ্যাপের ডিজাইন সুন্দর রাখতে নিচের মাপ অনুযায়ী ইমেজ আপলোড করুন:

| সেকশন (Section) | ডাইমেনশন (Dimension) | রেশিও (Aspect Ratio) |
| :--- | :--- | :--- |
| **Hero Main Slide** | 982 x 500 px | 21:11 |
| **Hero Side Banner** | 600 x 600 px | 1:1 (Square) |
| **Product Image** | 800 x 800 px | 1:1 (Square) |
| **Service Thumbnail** | 800 x 600 px | 4:3 |
| **Landing Page Hero** | 1200 x 400 px | 3:1 |
| **Navbar/Bottom Offer** | 200 x 200 px | 1:1 (Circle) |
| **Section Banner** | 1200 x 400 px | 21:7 |
| **Brand Logo** | 400 x 200 px | 2:1 |
| **Website Logo** | 512 x 512 px | 1:1 (PNG) |
| **Favicon** | 32 x 32 px | 1:1 |

## 🚀 Accessing the Admin Dashboard

The CRM portal is located at `/admin/dashboard`. To log in with your credentials (`smartclean422@gmail.com` / `@arman@2211@`), you MUST complete these steps in the Firebase Console:

### 1. Enable Authentication & Whitelist Domain
- Go to [Firebase Console](https://console.firebase.com/).
- Navigate to **Build > Authentication**.
- Go to the **Sign-in method** tab and enable **Email/Password**.
- Go to the **Settings** tab (within Authentication), then **Authorized domains**.
- Click **Add domain** and paste your current application's domain (e.g., the URL in your browser address bar without the path). **This fixes the `auth/network-request-failed` error.**

### 2. Create your User account
- In the **Authentication > Users** tab, click **Add user**.
- Email: `smartclean422@gmail.com`
- Password: `@arman@2211@`
- Click **Add user**.
- **IMPORTANT**: If you get `auth/invalid-credential`, it means this step was skipped or the password/email doesn't match exactly.

### 3. Verification
- Your UID is `6YTKdslETkVXcftvhSY5x9sjOgT2`. 
- The application is hardcoded to grant this specific UID full "Bootstrap Admin" privileges instantly once you log in.

### 4. Access the Dashboard
- Go to `/login` in your app.
- Enter the email and password you just created.
- You will be redirected to the Dashboard.
- Click **"Seed ERP Data"** to populate the system with orders, leads, and staff data.

## Features
- **Ecommerce ERP**: Product management, inventory tracking, and sales orders.
- **Service CRM**: Leads, real-time booking, and staff scheduling.
- **AI Agents**: Genkit-powered agents for Sales, Booking, and Support.
- **Analytics**: Revenue, profit/loss charts, and customer segmentation.
