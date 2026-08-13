
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "interviewai-bef88.firebaseapp.com",
  projectId: "interviewai-bef88",
  storageBucket: "interviewai-bef88.firebasestorage.app",
  messagingSenderId: "606790059976",
  appId: "1:606790059976:web:28c58d51725113414022fd"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider()

export {auth , provider}