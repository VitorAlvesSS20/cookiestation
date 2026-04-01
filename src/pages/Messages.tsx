import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const fetchingRef = useRef(false);

  const fetchChats = useCallback(async () => {
    if (!user?.uid || fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        "https://cookie-station-api.up.railway.app/chats",
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.ok) {
        const data = await response.json();
        const chatPromises = data.map(async (chat: any) => {
          const participants: string[] = chat.participants || [];
          const recipientId = participants.find((id) => id !== user.uid);
          if (!recipientId) return null;

          try {
            const userRes = await fetch(
              `https://cookie-station-api.up.railway.app/users/${recipientId}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            const userData = userRes.ok ? await userRes.json() : {};
            return {
              id: chat.id,
              recipientId,
              recipientName:
                userData.displayName || userData.username || "Escritor",
              recipientPhoto: userData.photoURL || "",
              lastMessage: chat.lastMessage || "",
              lastUpdate: chat.lastUpdate || 0,
            };
          } catch {
            return {
              id: chat.id,
              recipientId,
              recipientName: "Escritor",
              recipientPhoto: "",
              lastMessage: chat.lastMessage || "",
              lastUpdate: chat.lastUpdate || 0,
            };
          }
        });

        const resolvedChats = (await Promise.all(chatPromises)).filter(
          (c): c is Chat => c !== null,
        );

        const sorted = resolvedChats.sort(
          (a, b) => b.lastUpdate - a.lastUpdate,
        );
        setChats(sorted);

        if (activeChat) {
          const updated = sorted.find((c) => c.id === activeChat.id);
          if (updated) setActiveChat(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [user, activeChat]);

  useEffect(() => {
    fetchChats();
    const interval = window.setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await ConfirmDialog(
      "Apagar conversa?",
      "Deseja realmente remover este café da sua estante? Esta ação não pode ser desfeita.",
    );

    if (!result.isConfirmed) return;

    try {
      const token = await user?.getIdToken();
      const response = await fetch(
        `https://cookie-station-api.up.railway.app/chats/${chatId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.ok) {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (activeChat?.id === chatId) setActiveChat(null);
        Toast.fire({ icon: "success", title: "Conversa removida! ☕" });
      }
    } catch {
      Toast.fire({ icon: "error", title: "Erro ao remover conversa." });
    }
  };

  return (
    <div className={`messages-layout ${activeChat ? "chat-open" : ""}`}>
      <aside className="inbox-sidebar">
        <div className="inbox-header">
          <h2>Comunidade</h2>
          <UserSearch
            onSelectChat={(chat) => {
              const fullChat = chats.find((c) => c.id === chat.id);
              if (fullChat) setActiveChat(fullChat);
            }}
          />
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
                  <p className="inbox-preview">
                    {chat.lastMessage || "Inicie uma conversa..."}
                  </p>
                </div>

                <button
                  className="btn-delete-small"
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                >
                  🗑️
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
              <button
                className="mobile-back-button"
                onClick={() => setActiveChat(null)}
              >
                Voltar
              </button>
              <div className="chat-user-info">
                {activeChat.recipientPhoto && (
                  <img src={activeChat.recipientPhoto} alt="" />
                )}
                <h3>{activeChat.recipientName}</h3>
              </div>
            </header>
            <ChatWindow chatId={activeChat.id} />
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
