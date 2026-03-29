import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import ChatWindow from "../components/ChatWindow";
import UserSearch from "../components/UserSearch";
import "../styles/messages.css";

const Messages: React.FC = () => {
  const { user } = useAuth();

  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ========================= */
  /* LISTAR CHATS */
  /* ========================= */
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastUpdate", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        const recipientId = data.participants?.find(
          (id: string) => id !== user.uid
        );

        const recipientData = data.participantsData?.[recipientId] || {};

        return {
          id: docSnap.id,
          recipientId,
          recipientName: recipientData.name || "Usuário",
          recipientPhoto: recipientData.photoURL || "",
          lastMessage: data.lastMessage || "",
        };
      });

      setChats(chatData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  /* ========================= */
  /* DELETAR CHAT */
  /* ========================= */
  const handleDeleteChat = async (chatId: string) => {
    const confirmDelete = confirm("Deseja excluir esta conversa?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "chats", chatId));

      setChats((prev) => prev.filter((chat) => chat.id !== chatId));

      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }
    } catch (error) {
      console.error("Erro ao deletar chat:", error);
    }
  };

  /* ========================= */
  /* UI */
  /* ========================= */
  return (
    <div className="messages-layout fade-in">
      <aside className="inbox-sidebar">
        <div className="inbox-header">
          <h2>Comunidade</h2>
        </div>

        {/* 🔎 BUSCA DE USUÁRIOS */}
        <UserSearch onSelectChat={setActiveChat} />

        {/* 💬 LISTA DE CHATS */}
        <div className="inbox-list">
          {loading ? (
            <p className="no-chats">Carregando...</p>
          ) : chats.length > 0 ? (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`inbox-item ${
                  activeChat?.id === chat.id ? "active" : ""
                }`}
                onClick={() => setActiveChat(chat)}
              >
                {/* AVATAR */}
                <div className="inbox-avatar">
                  {chat.recipientPhoto ? (
                    <img src={chat.recipientPhoto} alt="avatar" />
                  ) : (
                    "☕"
                  )}
                </div>

                {/* INFO */}
                <div className="inbox-details">
                  <p className="inbox-name">{chat.recipientName}</p>
                  <p className="inbox-preview">
                    {chat.lastMessage || "Clique para conversar..."}
                  </p>
                </div>

                {/* DELETE */}
                <button
                  className="delete-chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                >
                  🗑
                </button>
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
            <p>Selecione um usuário para começar ☕</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;