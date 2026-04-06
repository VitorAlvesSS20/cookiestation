import { db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";

export const banUser = async (userId: string) => {
  await updateDoc(doc(db, "users", userId), {
    isBanned: true,
  });
};

export const muteUser = async (userId: string) => {
  await updateDoc(doc(db, "users", userId), {
    isMuted: true,
  });
};

export const unbanUser = async (userId: string) => {
  await updateDoc(doc(db, "users", userId), {
    isBanned: false,
    isMuted: false,
  });
};