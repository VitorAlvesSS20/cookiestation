import { db } from "./firebase";
import {
  collection, addDoc, getDocs, query,
  orderBy, doc, getDoc, updateDoc, deleteDoc
} from "firebase/firestore";

const storiesRef = collection(db, "stories");

export const createStory = async (title: string, content: string, userId: string) => {
  await addDoc(storiesRef, { title, content, userId, createdAt: new Date() });
};

export const getStories = async () => {
  const q = query(storiesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id, 
      title: data.title || "",
      content: data.content || "",
      userId: data.userId || "",
      createdAt: data.createdAt || null,
    };
  });
};

export const getStory = async (id: string) => {
  const docRef = doc(db, "stories", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title || "",
    content: data.content || "",
    userId: data.userId || "",
    createdAt: data.createdAt || null,
  };
};

export const updateStory = async (id: string, title: string, content: string) => {
  const docRef = doc(db, "stories", id);
  await updateDoc(docRef, { title, content });
};

export const deleteStory = async (id: string) => {
  const docRef = doc(db, "stories", id);
  await deleteDoc(docRef);
};