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

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  /* 🔥 TEMPO REAL COM TRAVA DE SEGURANÇA */
  useEffect(() => {
    if (!chatId || !db) return;

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
  }, [chatId]);

  /* 💬 ENVIAR MENSAGEM */
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !user || !chatId) return;

    try {
      const messageData = {
        text: text.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(), // Melhor que Date.now() para consistência de fuso horário
        seen: false,
      };

      // Limpa o input imediatamente para melhor UX
      const currentText = text;
      setText("");

      await addDoc(collection(db, "chats", chatId, "messages"), messageData);

      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: currentText,
        lastUpdate: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao enviar:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="chat-display">
      {/* HEADER FIXO - Impede o nome de flutuar */}
      <div className="chat-header">
        <h3>{recipientName || "Usuário"}</h3>
        <span>Online</span>
      </div>

      {/* ÁREA DE MENSAGENS COM SCROLL */}
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

      {/* FORMULÁRIO DE INPUT - Permite enviar com Enter */}
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