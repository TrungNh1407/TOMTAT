import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "gen-lang-client-0521133175",
  appId: "1:183066318236:web:de0d45cb80c60f90532459",
  apiKey: "AIzaSyAesrIasCCJz8nLy3xPOsxU2QDQ_ywM-WQ",
  authDomain: "gen-lang-client-0521133175.firebaseapp.com",
  storageBucket: "gen-lang-client-0521133175.firebasestorage.app",
  messagingSenderId: "183066318236",
  measurementId: ""
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
