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

const ChatWindow = ({ chatId, recipientName }: any) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const timeout = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeout);
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
      console.error("Erro:", error);
      setText(currentText);
    }
  };

  if (!user) return null;

  return (
    <div className="chat-display">
      {/* MANTENHA O HEADER AQUI se você removeu do Messages.tsx. 
         Se o nome não está aparecendo, é porque falta essa div abaixo:
      */}
      <header className="chat-header">
         {/* O botão de voltar (mobile-back-button) deve estar aqui ou no Messages.tsx */}
         <h3>{recipientName}</h3>
      </header>

      <div className="messages-area" ref={scrollRef}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`msg-bubble ${m.userId === user.uid ? "sent" : "received"}`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <form className="chat-input" onSubmit={sendMessage}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva sua mensagem..."
          autoFocus
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};

export default ChatWindow;