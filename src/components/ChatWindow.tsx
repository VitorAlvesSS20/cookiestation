import React, { useState, useEffect, useRef } from "react";
import { db } from "../services/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../styles/chat.css";

// 1. Definição da Interface (Resolve o erro do TypeScript)
interface ChatWindowProps {
  chatId: string;
  recipientName: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, recipientName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 2. Listener de mensagens em tempo real
  useEffect(() => {
    if (!chatId) return;
    
    const q = query(
      collection(db, "chats", chatId, "messages"), 
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [chatId]);

  // 3. Scroll automático para a última mensagem
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    const messageData = {
      senderId: user.uid,
      text: text.trim(),
      createdAt: serverTimestamp()
    };

    try {
      // Adiciona a mensagem na subcoleção
      await addDoc(collection(db, "chats", chatId, "messages"), messageData);
      
      // Atualiza o documento pai com a última mensagem (para a lista lateral)
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: text.trim(),
        lastUpdate: serverTimestamp()
      });
      
      setText("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  };

  return (
    <div className="chat-window">
      {/* Cabeçalho do Chat */}
      <div className="chat-header">
        <h3>{recipientName || "Carregando..." }</h3>
      </div>

      <div className="messages-area">
        {messages.map((m) => (
          <div 
            key={m.id} 
            className={`msg-bubble ${m.senderId === user?.uid ? "sent" : "received"}`}
          >
            {m.text}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input">
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Escreva sua mensagem..." 
        />
        <button type="submit" disabled={!text.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;