
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

## 🚀 How to Login (লগইন করার নিয়ম)

### 1. Admin Access (অ্যাডমিন এক্সেস)
অ্যাডমিন হিসেবে লগইন করতে সরাসরি নিচের লিঙ্কে যান:
**URL:** `/secure-admin-portal`
- **Email:** `smartclean422@gmail.com`
- **Password:** `admin123`

### 2. Standard User/Staff Login
সাধারণ ইউজার বা মেম্বার হিসেবে লগইন করতে:
**URL:** `/login`

## 🛠️ Accessing the Admin Dashboard

The CRM portal is located at `/admin/dashboard`. To log in with your credentials, you MUST complete these steps in the Firebase Console:

### 1. Enable Authentication & Whitelist Domain
- Go to [Firebase Console](https://console.firebase.com/).
- Navigate to **Build > Authentication**.
- Go to the **Sign-in method** tab and enable **Email/Password**.
- Go to the **Settings** tab (within Authentication), then **Authorized domains**.
- Click **Add domain** and paste your current application's domain.

### 2. Create your User account
- In the **Authentication > Users** tab, click **Add user**.
- Email: `smartclean422@gmail.com`
- Password: `admin123`
- Click **Add user**.

### 3. Verification
- Your current UID is `Q8QpZP1GzzWf2f2K6WTe476PcD92`. 
- The application is hardcoded to grant this specific UID full "Bootstrap Admin" privileges instantly once you log in.

## Features
- **Ecommerce ERP**: Product management, inventory tracking, and sales orders.
- **Service CRM**: Leads, real-time booking, and staff scheduling.
- **AI Agents**: Genkit-powered agents for Sales, Booking, and Support.
- **Analytics**: Revenue, profit/loss charts, and customer segmentation.
