import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import ChatWindow from "../components/ChatWindow";
import UserSearch from "../components/UserSearch";
import { Toast, ConfirmDialog } from "../utils/swal";

import "../styles/messages.css";

interface Chat {
  id: string;
  recipientId: string;
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

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        // Mapeamos os chats e buscamos os dados REAIS dos usuários na coleção /users
        const chatPromises = snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const participants: string[] = data.participants || [];
          const recipientId = participants.find((id) => id !== user.uid) || "";

          // Busca o documento do usuário para garantir sincronização de Nome e Foto
          const userDocRef = doc(db, "users", recipientId);
          const userSnap = await getDoc(userDocRef);
          const userData = userSnap.exists() ? userSnap.data() : {};

          return {
            id: docSnap.id,
            recipientId,
            recipientName: userData.displayName || userData.name || "Escritor",
            recipientPhoto: userData.photoURL || userData.photo || "",
            lastMessage: data.lastMessage || "",
            lastUpdate: data.lastUpdate?.toMillis 
              ? data.lastUpdate.toMillis() 
              : typeof data.lastUpdate === 'number' ? data.lastUpdate : 0,
          };
        });

        const resolvedChats = await Promise.all(chatPromises);
        setChats(resolvedChats.sort((a, b) => b.lastUpdate - a.lastUpdate));
        setLoading(false);
      } catch (err) {
        console.error("Erro ao processar chats:", err);
        setLoading(false);
      }
    }, (error) => {
      console.error("Erro no Listener do Firebase:", error);
      setLoading(false);
      if (error.code === 'permission-denied') {
        Toast.fire({ icon: "error", title: "Acesso negado à Estação de Mensagens." });
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Atualiza o activeChat se as informações do destinatário mudarem na lista principal
  useEffect(() => {
    if (activeChat) {
      const updatedChat = chats.find(c => c.id === activeChat.id);
      if (updatedChat && (updatedChat.recipientName !== activeChat.recipientName || updatedChat.recipientPhoto !== activeChat.recipientPhoto)) {
        setActiveChat(updatedChat);
      }
    }
  }, [chats, activeChat]);

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 

    const result = await ConfirmDialog(
      "Apagar conversa?",
      "Deseja realmente remover este café da sua estante? Esta ação não pode ser desfeita."
    );

    if (!result.isConfirmed) return;

    try {
      await deleteDoc(doc(db, "chats", chatId));
      if (activeChat?.id === chatId) setActiveChat(null);
      Toast.fire({ icon: "success", title: "Conversa removida! ☕" });
    } catch (error: any) {
      console.error("Erro ao deletar conversa:", error);
      Toast.fire({ icon: "error", title: "Erro ao remover conversa." });
    }
  };

  return (
    <div className={`messages-layout ${activeChat ? "chat-open" : ""}`}>
      <aside className="inbox-sidebar">
        <div className="inbox-header">
          <h2>Comunidade</h2>
          <UserSearch onSelectChat={(chat: any) => setActiveChat(chat)} />
        </div>

        <div className="inbox-list">
          {loading ? (
            <div className="loader-msg">
              <span className="spinner-coffee">☕</span> Carregando...
            </div>
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

                <button 
                  className="btn-delete-small" 
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                >
                  <span className="emoji-fallback">🗑️</span>
                </button>
              </div>
            ))
          ) : (
            <div className="empty-inbox">Nenhuma conversa por aqui ainda.</div>
          )}
        </div>
      </aside>

      <main className="chat-container">
        {activeChat ? (
          <div className="chat-display">
            <header className="chat-header">
              <button className="mobile-back-button" onClick={() => setActiveChat(null)}>
                Voltar
              </button>
              <div className="chat-user-info">
                {activeChat.recipientPhoto && <img src={activeChat.recipientPhoto} alt="" />}
                <h3>{activeChat.recipientName}</h3>
              </div>
            </header>
            <ChatWindow 
              chatId={activeChat.id} 
              recipientName={activeChat.recipientName} 
            />
          </div>
        ) : (
          <div className="no-chat-selected">
            <span className="coffee-icon">☕</span>
            <h3>Sua xícara está vazia</h3>
            <p>Selecione um escritor para iniciar uma conversa.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;