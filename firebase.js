import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';


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


export const addDocumentToCollection = async (userId, collectionPath, data) => {
  const collectionRef = collection(db, `users/${userId}/${collectionPath}`);
  const docRef = await addDoc(collectionRef, data);
  return docRef;
};

export const setDocument = async (userId, documentPath, data) => {
  const docRef = doc(db, `users/${userId}/${documentPath}`);
  await setDoc(docRef, data);
};

export const updateDocument = async (userId, documentPath, data) => {
  const docRef = doc(db, `users/${userId}/${documentPath}`);
  await updateDoc(docRef, data);
};

export const deleteDocument = async (userId, documentPath) => {
  const docRef = doc(db, `users/${userId}/${documentPath}`);
  await deleteDoc(docRef);
};