import { db } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export const reportContent = async (
  type: "story" | "comment" | "user",
  targetId: string,
  reason: string,
  userId: string
) => {
  await addDoc(collection(db, "reports"), {
    type,
    targetId,
    reason,
    reportedBy: userId,
    createdAt: serverTimestamp(),
  });
};