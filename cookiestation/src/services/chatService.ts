import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export const createOrGetChat = async (
  currentUser: any,
  targetUser: any
) => {
  const uid1 = currentUser.uid;
  const uid2 = targetUser.id || targetUser.uid;

  const chatId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    return chatId;
  }

  await setDoc(chatRef, {
    participants: [uid1, uid2],
    participantsData: {
      [uid1]: {
        name: currentUser.displayName || "Escritor",
        photoURL: currentUser.photoURL || "",
      },
      [uid2]: {
        name: targetUser.username || targetUser.displayName || "Escritor",
        photoURL: targetUser.photoURL || "",
      },
    },
    createdAt: serverTimestamp(),
    lastUpdate: serverTimestamp(),
    lastMessage: "",
  });

  return chatId;
};