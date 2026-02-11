import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAtblSuapG-FQLy-xUK2xd4bTrWKzt93fc",
  authDomain: "selton-25f38.firebaseapp.com",
  projectId: "selton-25f38",
  storageBucket: "selton-25f38.firebasestorage.app",
  messagingSenderId: "875607847316",
  appId: "1:875607847316:web:87f312baa6b0d471dfdf81",
  measurementId: "G-H7VMTB8BKC"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
