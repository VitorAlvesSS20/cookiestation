import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import ChatWindow from "../components/ChatWindow";
import "../styles/messages.css";

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastUpdate", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Lógica de QA: Identificar quem é o "Outro"
        // Se o array tem [UserA, UserB], e eu sou UserA, o destinatário é o UserB
        const recipientId = data.participants.find((id: string) => id !== user.uid);
        
        return { 
          id: doc.id, 
          recipientId,
          // Caso você já salve o nome no doc do chat para economizar leitura:
          recipientName: data.names?.[recipientId] || "Escritor", 
          ...data 
        };
      });
      setChats(chatData);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="messages-layout fade-in">
      <aside className="inbox-sidebar">
        <div className="inbox-title">
          <h2>Mensagens</h2>
        </div>
        <div className="inbox-list">
          {chats.length > 0 ? (
            chats.map(chat => (
              <div 
                key={chat.id} 
                className={`inbox-item ${activeChat?.id === chat.id ? "active" : ""}`}
                onClick={() => setActiveChat(chat)}
              >
                <div className="inbox-avatar">☕</div>
                <div className="inbox-details">
                  {/* Exibe o nome dinâmico em vez de fixo */}
                  <p className="inbox-name">{chat.recipientName}</p>
                  <p className="inbox-preview">{chat.lastMessage || "Clique para conversar..."}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-chats">Nenhuma conversa iniciada.</p>
          )}
        </div>
      </aside>

      <main className="chat-display">
        {activeChat ? (
          <ChatWindow 
            chatId={activeChat.id} 
            recipientName={activeChat.recipientName} 
          />
        ) : (
          <div className="no-chat-selected">
            <p>Selecione um autor para começar a trocar ideias.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;