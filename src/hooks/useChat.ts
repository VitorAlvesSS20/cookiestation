import { useState, useEffect } from "react";
import api from "../services/api";

export const useChat = (chatId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/chats/${chatId}/messages`);
        setMessages(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [chatId]);

  const sendMessage = async (user: any, text: string) => {
    if (!text.trim() || !chatId || !user) return;

    const payload = {
      text: text.trim()
    };

    try {
      await api.post(`/chats/${chatId}/messages`, payload);
      const response = await api.get(`/chats/${chatId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return { messages, sendMessage, loading };
};