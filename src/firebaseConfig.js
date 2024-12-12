import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  OAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDxe64j_0VEQvhGdFyOZBDgF-KzNPbPcSE",
  authDomain: "wraptrack-13800.firebaseapp.com",
  projectId: "wraptrack-13800",
  storageBucket: "wraptrack-13800.firebasestorage.app",
  messagingSenderId: "81798888785",
  appId: "1:81798888785:web:94a59b269884140586e770",
  measurementId: "G-DJWGVF5VNH"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

const spotifyProvider = new OAuthProvider('spotify.com');
spotifyProvider.addScope('user-read-private');
spotifyProvider.addScope('user-read-email');
spotifyProvider.addScope('user-top-read');

export { auth, spotifyProvider, signInWithPopup };