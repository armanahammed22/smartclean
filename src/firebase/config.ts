import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  projectId: "studio-5425564660-b1f7f",
  appId: "1:1012639715946:web:c5bda72aff647d14d1b013",
  apiKey: "AIzaSyA2LPcx8rgQWwzgerxhlPoXynBkvOcrHE0",
  authDomain: "studio-5425564660-b1f7f.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "1012639715946"
};

// 🔥 ADD BELOW THIS
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);