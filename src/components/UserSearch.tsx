import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

interface User {
  id: string;
  uid?: string;
  displayName: string;
  username?: string;
  photoURL?: string;
}

interface UserSearchProps {
  onSelectChat: (chat: { id: string; recipientName: string }) => void;
}

const UserSearch = ({ onSelectChat }: UserSearchProps) => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      if (!user || !debouncedSearch.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(`/users/search?q=${debouncedSearch}`, {
          signal: controller.signal
        });
        
        const filtered = response.data.filter((u: User) => (u.id || u.uid) !== user.uid);
        setResults(filtered);
      } catch (error: any) {
        if (error.name !== 'CanceledError') {
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    return () => controller.abort();
  }, [debouncedSearch, user]);

  const startChat = async (targetUser: User) => {
    if (!user) return;

    try {
      const response = await api.post("/chats", {
        targetUserId: targetUser.id,
        targetUserName: targetUser.displayName || targetUser.username,
        targetUserPhoto: targetUser.photoURL || ""
      });

      onSelectChat({
        id: response.data.id,
        recipientName: targetUser.displayName || targetUser.username || "Usuário",
      });

      setSearch("");
      setResults([]);
    } catch (error) {
      console.error(error);
    }
  };

  if (!user) return null;

  return (
    <div className="user-search-container">
      <div className="search-input-wrapper">
        <input
          className="search-input"
          placeholder="Buscar escritores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading && <small style={{ color: "#fff", marginLeft: "10px" }}>Buscando...</small>}
      </div>

      {results.length > 0 && (
        <div className="search-results-dropdown">
          {results.map((u) => (
            <div 
              key={u.id} 
              className="inbox-item" 
              onClick={() => startChat(u)}
              style={{ cursor: 'pointer', borderBottom: "1px solid rgba(212, 163, 115, 0.1)" }}
            >
              <div className="inbox-avatar">
                {u.photoURL ? (
                  <img src={u.photoURL} alt={u.displayName} />
                ) : (
                  <div className="avatar-placeholder">☕</div>
                )}
              </div>

              <div className="inbox-info">
                <p className="inbox-name" style={{ color: "#fff", margin: 0 }}>
                  {u.displayName || u.username}
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