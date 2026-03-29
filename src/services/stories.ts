import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { isContentAllowed } from "./moderation";

/* ========================= */
/* REF */
/* ========================= */
const storiesRef = collection(db, "stories");

/* ========================= */
/* CREATE STORY */
/* ========================= */
export const createStory = async (
  title: string,
  content: string,
  userId: string
) => {
  // 🚫 filtro +18
  if (!isContentAllowed(title + " " + content)) {
    throw new Error("Conteúdo proibido 🚫");
  }

  await addDoc(storiesRef, {
    title,
    content,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    // ❤️ sistema de likes
    likes: [],
    likesCount: 0,
  });
};

/* ========================= */
/* GET ALL STORIES */
/* ========================= */
export const getStories = async () => {
  const q = query(storiesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      title: data.title || "",
      content: data.content || "",
      userId: data.userId || "",
      createdAt: data.createdAt || null,
      likes: data.likes || [],
      likesCount: data.likesCount || 0,
    };
  });
};

/* ========================= */
/* GET ONE STORY */
/* ========================= */
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
    likes: data.likes || [],
    likesCount: data.likesCount || 0,
  };
};

/* ========================= */
/* UPDATE STORY */
/* ========================= */
export const updateStory = async (
  id: string,
  title: string,
  content: string
) => {
  // 🚫 filtro +18
  if (!isContentAllowed(title + " " + content)) {
    throw new Error("Conteúdo proibido 🚫");
  }

  const docRef = doc(db, "stories", id);

  await updateDoc(docRef, {
    title,
    content,
    updatedAt: serverTimestamp(),
  });
};

/* ========================= */
/* DELETE STORY */
/* ========================= */
export const deleteStory = async (id: string) => {
  const docRef = doc(db, "stories", id);
  await deleteDoc(docRef);
};

/* ========================= */
/* LIKE / UNLIKE */
/* ========================= */
export const toggleLike = async (
  storyId: string,
  userId: string,
  alreadyLiked: boolean
) => {
  const docRef = doc(db, "stories", storyId);

  if (alreadyLiked) {
    await updateDoc(docRef, {
      likes: arrayRemove(userId),
      likesCount: increment(-1),
    });
  } else {
    await updateDoc(docRef, {
      likes: arrayUnion(userId),
      likesCount: increment(1),
    });
  }
};