import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBMSB1qiOqCSdlv9z18NdU1qW9q1joyarc",
    authDomain: "life-game-ea393.firebaseapp.com",
    projectId: "life-game-ea393",
    storageBucket: "life-game-ea393.firebasestorage.app",
    messagingSenderId: "553368226586",
    appId: "1:553368226586:web:f7abc2959476759fc57aa3",
    measurementId: "G-Y3XG7FPZWC"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);