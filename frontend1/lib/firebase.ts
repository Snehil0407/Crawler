import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCnRIKn4bhWE5pTEzpdQ2VJF73j4WEv_2w",
  authDomain: "websentinal-f92ec.firebaseapp.com",
  databaseURL: "https://websentinal-f92ec-default-rtdb.firebaseio.com",
  projectId: "websentinal-f92ec",
  storageBucket: "websentinal-f92ec.firebasestorage.app",
  messagingSenderId: "1029931119218",
  appId: "1:1029931119218:web:1b666a2e129560c9d588eb",
  measurementId: "G-7DVNDBSZ6T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
