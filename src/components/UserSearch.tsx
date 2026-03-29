import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

const UserSearch = ({ onSelectChat }: any) => {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);

  // Debounce para não sobrecarregar o Firestore a cada tecla
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !debouncedSearch.trim()) {
        setResults([]);
        return;
      }

      // Busca por prefixo (Case Sensitive no Firestore)
      const q = query(
        collection(db, "users"),
        where("displayName", ">=", debouncedSearch),
        where("displayName", "<=", debouncedSearch + "\uf8ff")
      );

      const snap = await getDocs(q);

      setResults(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u: any) => u.id !== user.uid)
      );
    };

    fetchUsers();
  }, [debouncedSearch, user]);

  /* 🔥 INICIAR OU RECUPERAR CHAT */
  const startChat = async (targetUser: any) => {
    if (!user) return;

    // Participantes ordenados para garantir ID único de conversa entre 2 pessoas
    const participants = [user.uid, targetUser.id].sort();

    const q = query(
      collection(db, "chats"),
      where("participants", "==", participants)
    );

    const existing = await getDocs(q);

    let chatId;
    let recipientName = targetUser.displayName;

    if (!existing.empty) {
      // Chat já existe
      chatId = existing.docs[0].id;
    } else {
      // Criar novo chat com a estrutura de dados necessária
      const newChat = await addDoc(collection(db, "chats"), {
        participants,
        participantsData: {
          [user.uid]: {
            name: user.displayName || "Escritor",
            photoURL: user.photoURL || "",
          },
          [targetUser.id]: {
            name: targetUser.displayName || "Escritor",
            photoURL: targetUser.photoURL || "",
          },
        },
        lastMessage: "",
        lastUpdate: serverTimestamp(), // Melhor que Date.now() para Firestore
      });
      chatId = newChat.id;
    }

    // Callback para a Messages.tsx
    onSelectChat({
      id: chatId,
      recipientName: recipientName,
    });

    // Limpa a busca após selecionar
    setSearch("");
    setResults([]);
  };

  if (!user) return null;

  return (
    <div className="user-search-container">
      <div className="search-input-wrapper">
        <input
          className="search-input" // Classe que adicionamos no CSS anteriormente
          placeholder="Buscar escritores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {results.length > 0 && (
        <div className="search-results-dropdown">
          {results.map((u) => (
            <div 
              key={u.id} 
              className="inbox-item" 
              onClick={() => startChat(u)}
              style={{ borderBottom: "1px solid rgba(212, 163, 115, 0.1)" }}
            >
              <div className="inbox-avatar">
                {u.photoURL ? (
                  <img src={u.photoURL} alt={u.displayName} />
                ) : (
                  <div style={{ fontSize: "1.2rem", textAlign: "center", lineHeight: "50px" }}>☕</div>
                )}
              </div>

              <div className="inbox-info">
                <p className="inbox-name" style={{ color: "#fff", margin: 0 }}>
                  {u.displayName}
                </p>
                <p className="inbox-preview" style={{ color: "var(--cookie-gold)", fontSize: "0.75rem" }}>
                  Clique para iniciar conversa
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearch;