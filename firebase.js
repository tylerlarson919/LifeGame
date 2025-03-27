import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, runTransaction, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';
import { parseDate } from "@internationalized/date";

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

// ### Cache Helper Functions

/** Extracts the collection path from a document path (e.g., 'stages/stage1' -> 'stages') */
const getCollectionPathFromDocumentPath = (documentPath) => {
  const parts = documentPath.split('/');
  parts.pop(); // Remove the document ID
  return parts.join('/');
};

/** Extracts the document ID from a document path (e.g., 'stages/stage1' -> 'stage1') */
const getDocIdFromDocumentPath = (documentPath) => {
  const parts = documentPath.split('/');
  return parts.pop();
};

/** Generates a unique cache key for a collection path */
const getCacheKey = (collectionPath) => {
  return `cache_${collectionPath.replace(/\//g, '_')}`;
};

/** Loads cached data from local storage for a collection */
const loadCache = (collectionPath) => {
  const key = getCacheKey(collectionPath);
  const cached = localStorage.getItem(key);
  return cached ? JSON.parse(cached) : [];
};

/** Saves data to local storage for a collection */
const saveCache = (collectionPath, data) => {
  const key = getCacheKey(collectionPath);
  localStorage.setItem(key, JSON.stringify(data));
};

/** Updates or sets a document in the cache (overwrites existing data) */
const setDocumentInCache = (collectionPath, docId, data) => {
  const cache = loadCache(collectionPath);
  const index = cache.findIndex((doc) => doc.id === docId);
  if (index !== -1) {
    cache[index] = { id: docId, ...data };
  } else {
    cache.push({ id: docId, ...data });
  }
  saveCache(collectionPath, cache);
};

/** Merges update data into an existing document in the cache */
const mergeDocumentInCache = (collectionPath, docId, updateData) => {
  const cache = loadCache(collectionPath);
  const index = cache.findIndex((doc) => doc.id === docId);
  if (index !== -1) {
    cache[index] = { ...cache[index], ...updateData };
  } else {
    cache.push({ id: docId, ...updateData });
  }
  saveCache(collectionPath, cache);
};

/** Removes a document from the cache */
const deleteDocumentFromCache = (collectionPath, docId) => {
  const cache = loadCache(collectionPath);
  const updatedCache = cache.filter((doc) => doc.id !== docId);
  saveCache(collectionPath, updatedCache);
};

/** Adds a new document to the cache */
const addDocumentToCache = (collectionPath, docId, data) => {
  const cache = loadCache(collectionPath);
  cache.push({ id: docId, ...data });
  saveCache(collectionPath, cache);
};

/** Purges the cache for a collection when data syncs to the server */
const purgeCache = (collectionPath) => {
  const key = getCacheKey(collectionPath);
  localStorage.removeItem(key);
};

// ### CRUD Functions with Local Storage Caching

/** Adds a document to a collection and caches it locally */
export const addDocumentToCollection = async (userId, collectionPath, data) => {
  const collectionRef = collection(db, `users/${userId}/${collectionPath}`);
  const docRef = await addDoc(collectionRef, data);
  const newDocId = docRef.id;
  // Cache the data to local storage
  addDocumentToCache(`users/${userId}/${collectionPath}`, newDocId, data);
  // Purge cache after successful sync (assuming Firestore's offline persistence confirms sync)
  // Since addDoc resolves when synced (or cached offline), we rely on onSnapshot to update cache,
  // so no immediate purge here; purge is handled in listeners when server confirms
  return docRef;
};

/** Sets a document and caches it locally */
export const setDocument = async (userId, documentPath, data) => {
  const collectionPath = getCollectionPathFromDocumentPath(documentPath);
  const docId = getDocIdFromDocumentPath(documentPath);
  const fullCollectionPath = `users/${userId}/${collectionPath}`;
  // Cache the data to local storage
  setDocumentInCache(fullCollectionPath, docId, data);
  // Perform setDoc
  const docRef = doc(db, `users/${userId}/${documentPath}`);
  await setDoc(docRef, data, { merge: false });
  // Purge cache after successful sync (handled in onSnapshot listeners)
};

/** Updates a document and caches the updates locally */
export const updateDocument = async (userId, documentPath, updateData) => {
  const collectionPath = getCollectionPathFromDocumentPath(documentPath);
  const docId = getDocIdFromDocumentPath(documentPath);
  const fullCollectionPath = `users/${userId}/${collectionPath}`;
  // Cache the updated data to local storage
  mergeDocumentInCache(fullCollectionPath, docId, updateData);
  // Perform updateDoc
  const docRef = doc(db, `users/${userId}/${documentPath}`);
  await updateDoc(docRef, updateData);
  // Purge cache after successful sync (handled in onSnapshot listeners)
};

/** Deletes a document and removes it from the cache */
export const deleteDocument = async (userId, documentPath) => {
  const collectionPath = getCollectionPathFromDocumentPath(documentPath);
  const docId = getDocIdFromDocumentPath(documentPath);
  const fullCollectionPath = `users/${userId}/${collectionPath}`;
  // Remove from cache
  deleteDocumentFromCache(fullCollectionPath, docId);
  // Perform deleteDoc
  const docRef = doc(db, `users/${userId}/${documentPath}`);
  await deleteDoc(docRef);
  // Purge cache after successful sync (handled in onSnapshot listeners)
};

/** Tweaks a field value on a document and caches it locally */
export const tweakValueOnDocument = async (userId, documentPath, fieldName, value) => {
  const collectionPath = getCollectionPathFromDocumentPath(documentPath);
  const docId = getDocIdFromDocumentPath(documentPath);
  const fullCollectionPath = `users/${userId}/${collectionPath}`;
  // Cache the updated field to local storage
  mergeDocumentInCache(fullCollectionPath, docId, { [fieldName]: value });
  // Perform updateDoc
  const docRef = doc(db, `users/${userId}/${documentPath}`);
  await updateDoc(docRef, { [fieldName]: value });
  // Purge cache after successful sync (handled in onSnapshot listeners)
};

// ### Fetch and Listener Functions

/** Fetches stages, queries local cache first, and combines with Firestore data */
export const fetchStages = async (userId) => {
  const collectionPath = `users/${userId}/stages`;
  // Load cached data first
  let cachedData = loadCache(collectionPath);
  
  // Fetch from Firestore
  const querySnapshot = await getDocs(collection(db, collectionPath));
  const firestoreData = querySnapshot.docs.map((doc) => {
    const docData = doc.data();
    return {
      id: doc.id,
      ...docData,
      dateRange: docData.dateRange
        ? {
            start: parseDate(docData.dateRange.start),
            end: parseDate(docData.dateRange.end),
          }
        : null,
    };
  });
  
  // Combine cached data with Firestore data (Firestore takes precedence)
  const combinedData = firestoreData.map((doc) => {
    const cachedDoc = cachedData.find((c) => c.id === doc.id);
    return cachedDoc ? { ...doc, ...cachedDoc } : doc;
  });
  
  // Add any cached documents that aren't in Firestore yet (e.g., pending adds)
  cachedData.forEach((cachedDoc) => {
    if (!combinedData.some((doc) => doc.id === cachedDoc.id)) {
      combinedData.push(cachedDoc);
    }
  });
  
  // Sort the combined data
  combinedData.sort((a, b) => {
    if (!a.dateRange || !b.dateRange) return a.dateRange ? 1 : -1;
    return a.dateRange.end.compare(b.dateRange.end);
  });
  
  // Update cache with combined data
  saveCache(collectionPath, combinedData);
  return combinedData;
};

/** Listens to quests and stages, returns data and stagesData, updates cache, and purges on sync */
/** Listens to quests and stages, returns data and stagesData, updates cache, and purges on sync */
export const listenToQuestsAndStages = (userId, callback) => {
  const questsPath = `users/${userId}/quests`;
  const stagesPath = `users/${userId}/stages`;

  // Load initial cached data
  const cachedQuests = loadCache(questsPath);
  const cachedStages = loadCache(stagesPath);

  let questsData = cachedQuests;
  let stagesData = cachedStages;

  const unsubscribeQuests = onSnapshot(
    collection(db, questsPath),
    (snapshot) => {
      questsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Combine with cached data (Firestore takes precedence)
      const combinedQuests = questsData.map((doc) => {
        const cachedDoc = cachedQuests.find((c) => c.id === doc.id);
        return cachedDoc ? { ...doc, ...cachedDoc } : doc;
      });
      cachedQuests.forEach((cachedDoc) => {
        if (!combinedQuests.some((doc) => doc.id === cachedDoc.id)) {
          combinedQuests.push(cachedDoc);
        }
      });

      saveCache(questsPath, combinedQuests);
      if (!snapshot.metadata.hasPendingWrites) {
        purgeCache(questsPath);
      }

      callback({ data: combinedQuests, stagesData });
    },
    (error) => {
      console.error('Quests listener error:', error);
    }
  );

  const unsubscribeStages = onSnapshot(
    collection(db, stagesPath),
    (snapshot) => {
      stagesData = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          dateRange: docData.dateRange
            ? {
                start: parseDate(docData.dateRange.start),
                end: parseDate(docData.dateRange.end),
              }
            : null,
        };
      });

      // Combine with cached data
      const combinedStages = stagesData.map((doc) => {
        const cachedDoc = cachedStages.find((c) => c.id === doc.id);
        return cachedDoc ? { ...doc, ...cachedDoc } : doc;
      });
      cachedStages.forEach((cachedDoc) => {
        if (!combinedStages.some((doc) => doc.id === cachedDoc.id)) {
          // Parse dateRange if present in cached data
          const parsedCachedDoc = {
            ...cachedDoc,
            dateRange: cachedDoc.dateRange
              ? {
                  start: parseDate(cachedDoc.dateRange.start),
                  end: parseDate(cachedDoc.dateRange.end),
                }
              : null,
          };
          combinedStages.push(parsedCachedDoc);
        }
      });

      // Save to cache with serialized dateRange
      const serializedStages = combinedStages.map((stage) => ({
        ...stage,
        dateRange: stage.dateRange
          ? {
              start: stage.dateRange.start.toString(),
              end: stage.dateRange.end.toString(),
            }
          : null,
      }));
      saveCache(stagesPath, serializedStages);
      if (!snapshot.metadata.hasPendingWrites) {
        purgeCache(stagesPath);
      }

      callback({ data: questsData, stagesData: combinedStages });
    },
    (error) => {
      console.error('Stages listener error:', error);
    }
  );

  // Return initial data with parsed dateRange for stages
  return {
    initialData: {
      data: cachedQuests,
      stagesData: cachedStages.map((stage) => ({
        ...stage,
        dateRange: stage.dateRange
          ? {
              start: parseDate(stage.dateRange.start),
              end: parseDate(stage.dateRange.end),
            }
          : null,
      })),
    },
    unsubscribe: () => {
      unsubscribeQuests();
      unsubscribeStages();
    },
  };
};

// ### Other Functions (Unchanged)

export const immediateSync = async (userId, documentPath, data) => {
  const docRef = doc(db, `users/${userId}/${documentPath}`);
  await setDoc(docRef, data, { merge: true });
};

export const listenToChanges = (userId, documentPath, callback) => {
  const path = `users/${userId}/${documentPath}`;
  const unsub = onSnapshot(doc(db, path), (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      callback(data);
    } else {
      console.log('No such document!');
    }
  });
  return unsub;
};

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
    });
    console.log('Transaction successfully committed!');
    return true;
  } catch (error) {
    console.log('Transaction failed: ', error);
    return false;
  }
};

export const forceSyncAll = async () => {
  // No pending queue anymore, but kept for compatibility
  return true;
};