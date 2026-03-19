"use client";

import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyA2LPcx8rgQNwzgerxh1PoXynBkvOcrHE0",
  authDomain: "studio-5425564660-b1f7f.firebaseapp.com",
  projectId: "studio-5425564660-b1f7f",
};

const app = !getApps().length 
  ? initializeApp(firebaseConfig) 
  : getApp();

export default app;
export { firebaseConfig } ;