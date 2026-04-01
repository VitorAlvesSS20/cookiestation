import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";

export const useChat = (chatId: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!chatId || fetchingRef.current) return;

    fetchingRef.current = true;

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await api.get(`/chats/${chatId}/messages`, {
        signal: controller.signal
      });
      setMessages(response.data);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setMessages([]);
      }
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      setMessages([]);
      return;
    }

    setLoading(true);
    fetchMessages();

    const interval = setInterval(fetchMessages, 3000);

    return () => {
      clearInterval(interval);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [chatId, fetchMessages]);

  const sendMessage = async (user: any, text: string) => {
    if (!text.trim() || !chatId || !user) return;

    const optimisticMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      userId: user.uid,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await api.post(`/chats/${chatId}/messages`, {
        text: text.trim()
      });
      fetchMessages();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    }
  };

  return { messages, sendMessage, loading };
};