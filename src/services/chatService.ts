import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

export const createOrGetChat = async (
  currentUser: any,
  targetUser: any
) => {
  const uid1 = currentUser?.uid;
  const uid2 = targetUser?.id || targetUser?.uid;

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
      [uids[0]]: {
        name:
          uids[0] === uid1
            ? currentUser?.displayName || "Escritor"
            : targetUser?.displayName || targetUser?.username || "Escritor",
        photoURL:
          uids[0] === uid1
            ? currentUser?.photoURL || ""
            : targetUser?.photoURL || ""
      },
      [uids[1]]: {
        name:
          uids[1] === uid1
            ? currentUser?.displayName || "Escritor"
            : targetUser?.displayName || targetUser?.username || "Escritor",
        photoURL:
          uids[1] === uid1
            ? currentUser?.photoURL || ""
            : targetUser?.photoURL || ""
      }
    },
    createdAt: serverTimestamp(),
    lastUpdate: serverTimestamp(),
    lastMessage: ""
  };

  await setDoc(chatRef, chatData);

  return chatId;
};