import { useEffect, useState, useRef } from "react";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const ChatWindow = ({ chatId }: any) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setMessages(msgs);
    });

    return () => unsub();
  }, [chatId, user?.uid]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !user || !chatId) return;

    const currentText = text.trim();
    setText(""); 

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: currentText,
        userId: user.uid,
        createdAt: serverTimestamp(),
        seen: false,
      });

      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: currentText,
        lastUpdate: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
      setText(currentText);
    }
  };

  if (!user) return null;

  return (
    <div className="chat-window-inner">
      <div className="messages-area" ref={scrollRef}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`msg-bubble ${m.userId === user.uid ? "sent" : "received"}`}
          >
            <div className="msg-text">{m.text}</div>
          </div>
        ))}
      </div>

      <form className="chat-input-form" onSubmit={sendMessage}>
        <div className="input-wrapper">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva sua mensagem..."
            autoFocus
          />
          <button type="submit" disabled={!text.trim()}>
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;