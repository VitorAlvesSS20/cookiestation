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
  const uid2 = targetUser.uid;

  // 🧠 ID determinístico (ordem garante unicidade)
  const chatId =
    uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;

  const chatRef = doc(db, "chats", chatId);
  const chatSnap = await getDoc(chatRef);

  // 🔍 Se já existe → retorna
  if (chatSnap.exists()) {
    return chatId;
  }

  // 🆕 Criar novo chat
  await setDoc(chatRef, {
    participants: [uid1, uid2],

    // 🔥 DADOS PARA UI
    participantsData: {
      [uid1]: {
        name: currentUser.displayName || "Usuário",
        photoURL: currentUser.photoURL || "",
      },
      [uid2]: {
        name: targetUser.displayName || "Usuário",
        photoURL: targetUser.photoURL || "",
      },
    },

    createdAt: serverTimestamp(),
    lastUpdate: serverTimestamp(),
    lastMessage: "",
  });

  return chatId;
};