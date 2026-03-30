import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import ChatWindow from "../components/ChatWindow";
import UserSearch from "../components/UserSearch";
import { Toast, ConfirmDialog } from "../utils/swal";

import "../styles/messages.css";

interface Chat {
  id: string;
  recipientId: string | undefined;
  recipientName: string;
  recipientPhoto: string;
  lastMessage: string;
  lastUpdate: number;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData: Chat[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const participants: string[] = data.participants || [];
        const recipientId = participants.find((id) => id !== user.uid);

        const recipientData = data.participantsData && recipientId
            ? data.participantsData[recipientId] || {}
            : {};

        return {
          id: docSnap.id,
          recipientId,
          recipientName: recipientData.name || "Escritor",
          recipientPhoto: recipientData.photoURL || "",
          lastMessage: data.lastMessage || "",
          lastUpdate: data.lastUpdate?.toMillis 
            ? data.lastUpdate.toMillis() 
            : typeof data.lastUpdate === 'number' ? data.lastUpdate : 0,
        };
      });

      setChats(chatData.sort((a, b) => b.lastUpdate - a.lastUpdate));
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await ConfirmDialog(
      "Apagar conversa?",
      "Deseja realmente remover este café da sua estante?"
    );

    if (!result.isConfirmed) return;

    try {
      await deleteDoc(doc(db, "chats", chatId));
      if (activeChat?.id === chatId) setActiveChat(null);
      Toast.fire({ icon: "success", title: "Conversa removida! ☕" });
    } catch (error) {
      Toast.fire({ icon: "error", title: "Erro ao deletar." });
    }
  };

  return (
    <div className={`messages-layout ${activeChat ? "chat-open" : ""}`}>
      <aside className="inbox-sidebar">
        <div className="inbox-header">
          <h2>Comunidade</h2>
          <UserSearch onSelectChat={setActiveChat} />
        </div>

        <div className="inbox-list">
          {loading ? (
            <div className="loader-msg">☕ Carregando...</div>
          ) : chats.length > 0 ? (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`inbox-item ${activeChat?.id === chat.id ? "active" : ""}`}
                onClick={() => setActiveChat(chat)}
              >
                <div className="inbox-avatar">
                  {chat.recipientPhoto ? (
                    <img src={chat.recipientPhoto} alt={chat.recipientName} />
                  ) : (
                    <div className="avatar-placeholder">☕</div>
                  )}
                </div>

                <div className="inbox-info">
                  <p className="inbox-name">{chat.recipientName}</p>
                  <p className="inbox-preview">{chat.lastMessage || "Inicie uma conversa..."}</p>
                </div>

                <button className="btn-delete-small" onClick={(e) => handleDeleteChat(chat.id, e)}>
                  🗑️
                </button>
              </div>
            ))
          ) : (
            <div className="loader-msg">Nenhuma conversa.</div>
          )}
        </div>
      </aside>

      <main className="chat-container">
        {activeChat ? (
          <div className="chat-display">
            <header className="chat-header">
              <button className="mobile-back-button" onClick={() => setActiveChat(null)}>
                <i className="fi fi-rr-arrow-small-left"></i>
              </button>
              <div className="chat-user-info">
                {activeChat.recipientPhoto && <img src={activeChat.recipientPhoto} alt="" />}
                <h3>{activeChat.recipientName}</h3>
              </div>
            </header>
            <ChatWindow chatId={activeChat.id} recipientName={activeChat.recipientName} />
          </div>
        ) : (
          <div className="no-chat-selected">
            <span className="coffee-icon">☕</span>
            <h3>Sua xícara está vazia</h3>
            <p>Selecione um escritor para conversar.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;