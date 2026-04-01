import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

interface Message {
  id: string;
  text: string;
  userId: string;
  createdAt: string;
}

interface ChatWindowProps {
  chatId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [canRead, setCanRead] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    if (!chatId || !user) return;

    let interval: number;

    const fetchMessages = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        const token = await user.getIdToken();
        const response = await fetch(
          `https://cookie-station-api.up.railway.app/chats/${chatId}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const data: Message[] = await response.json();
          setMessages(data);
          setCanRead(true);
        } else if (response.status === 403) {
          setCanRead(false);
        }
      } catch (error) {
        console.error(error);
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchMessages();
    interval = window.setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [chatId, user]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !user || !chatId) return;

    const currentText = text.trim();
    setText("");

    const optimisticMessage: Message = {
      id: Date.now().toString(),
      text: currentText,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `https://cookie-station-api.up.railway.app/chats/${chatId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: currentText }),
        },
      );

      if (!response.ok) throw new Error("Erro ao enviar mensagem");
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setText(currentText);
      console.error(error);
    }
  };

  if (!user || !canRead) return null;

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
