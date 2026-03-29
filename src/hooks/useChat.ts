import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc
} from "firebase/firestore";

export const useChat = (chatId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) return;

    const msgRef = collection(db, "chats", chatId, "messages");
    const q = query(msgRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setMessages(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async (user: any, text: string) => {
    if (!text.trim()) return;

    const chatRef = doc(db, "chats", chatId);
    const messagesRef = collection(db, "chats", chatId, "messages");

    await addDoc(messagesRef, {
      senderId: user.uid,
      senderName: user.displayName,
      senderPhoto: user.photoURL,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });

    await updateDoc(chatRef, {
      lastUpdate: serverTimestamp(),
      lastMessage: text.trim(),
    });
  };

  return { messages, sendMessage, loading };
};