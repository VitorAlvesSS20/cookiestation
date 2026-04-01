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

  if (!uid1 || !uid2 || uid1 === uid2) return null;

  const uids = [uid1, uid2].sort();
  const chatId = `${uids[0]}_${uids[1]}`;

  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  if (chatSnap.exists()) {
    return chatId;
  }

  const chatData = {
    participants: uids,
    participantsData: {
      [uid1]: {
        name: currentUser.displayName || "Escritor",
        photoURL: currentUser.photoURL || "",
      },
      [uid2]: {
        name: targetUser.displayName || targetUser.username || "Escritor",
        photoURL: targetUser.photoURL || "",
      },
    },
    createdAt: serverTimestamp(),
    lastUpdate: serverTimestamp(),
    lastMessage: "",
  };

  await setDoc(chatRef, chatData);

  return chatId;
};