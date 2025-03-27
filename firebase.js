import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  runTransaction,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';


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

// Local cache for changes
const localCache = new Map();
let syncQueue = [];

// Utility: Debounce
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Debounced sync function
const scheduleSync = debounce(async () => {
  await processSyncQueue();
}, 30000); // 30 seconds debounce period

// Process sync queue
const processSyncQueue = async () => {
  if (syncQueue.length === 0) return;

  const batch = writeBatch(db);
  for (const key of syncQueue) {
    const cachedDoc = localCache.get(key);
    if (cachedDoc) {
      const docRef = doc(db, key);
      batch.set(docRef, cachedDoc.data, { merge: true });
    }
  }
  await batch.commit();
  syncQueue = [];
  console.log('Changes synced');
};


// Add change to local cache
export const cacheChange = (userId, documentPath, data) => {
  const key = `users/${userId}/${documentPath}`;
  localCache.set(key, { data, lastModified: Date.now() });
  syncQueue.push(key);
  scheduleSync();
};

// Immediate sync for critical updates
export const immediateSync = async (userId, documentPath, data) => {
  const docRef = doc(db, `users/${userId}/${documentPath}`);
  await setDoc(docRef, data, { merge: true });
};

export const addDocumentToCollection = async (userId, collectionPath, data) => {
  const collectionRef = collection(db, `users/${userId}/${collectionPath}`);
  const docRef = await addDoc(collectionRef, data);
  return docRef;
};

export const setDocument = async (userId, documentPath, data) => {
  const key = `users/${userId}/${documentPath}`;
  // Cache the change locally
  localCache.set(key, { data, lastModified: Date.now() });
  syncQueue.push(key);
  scheduleSync();
  
  // For immediate feedback in the UI
  return { id: documentPath.split('/').pop(), ...data };
};

export const updateDocument = async (userId, documentPath, data) => {
  const key = `users/${userId}/${documentPath}`;
  
  // Get existing data from cache or create new
  const existing = localCache.get(key)?.data || {};
  const updatedData = { ...existing, ...data };
  
  // Update cache
  localCache.set(key, { data: updatedData, lastModified: Date.now() });
  syncQueue.push(key);
  scheduleSync();
  
  return updatedData;
};

export const deleteDocument = async (userId, documentPath) => {
  // For critical operations like delete, perform immediately
  const docRef = doc(db, `users/${userId}/${documentPath}`);
  await deleteDoc(docRef);
  
  // Also remove from local cache if exists
  const key = `users/${userId}/${documentPath}`;
  localCache.delete(key);
};

export const tweakValueOnDocument = async (userId, documentPath, fieldName, value) => {
  const key = `users/${userId}/${documentPath}`;
  
  // Get existing data from cache or create new
  const existing = localCache.get(key)?.data || {};
  const updatedData = { ...existing, [fieldName]: value };
  
  // Update cache
  localCache.set(key, { data: updatedData, lastModified: Date.now() });
  syncQueue.push(key);
  scheduleSync();
  
  return updatedData;
};

// Listen for changes (with onSnapshot)
export const listenToChanges = (userId, documentPath, callback) => {
  const path = `users/${userId}/${documentPath}`;
  const unsub = onSnapshot(doc(db, path), (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      // Update local cache with server data
      localCache.set(path, { data, lastModified: Date.now() });
      callback(data);
    } else {
      console.log('No such document!');
    }
  });
  return unsub;
};

// Transactional update for operations that need atomicity
export const transactionalUpdate = async (userId, documentPath, updateFunction) => {
  const docRef = doc(db, `users/${userId}/${documentPath}`);
  try {
    await runTransaction(db, async (transaction) => {
      const docSnapshot = await transaction.get(docRef);
      if (!docSnapshot.exists()) {
        throw 'Document does not exist!';
      }
      const newData = updateFunction(docSnapshot.data());
      transaction.update(docRef, newData);
      
      // Update local cache after successful transaction
      const key = `users/${userId}/${documentPath}`;
      localCache.set(key, { data: newData, lastModified: Date.now() });
    });
    console.log('Transaction successfully committed!');
    return true;
  } catch (error) {
    console.log('Transaction failed: ', error);
    return false;
  }
};

// Force sync all pending changes
export const forceSyncAll = async () => {
  await processSyncQueue();
  return true;
};
