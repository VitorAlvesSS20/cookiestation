import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  onSnapshot
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { createOrGetChat } from "../services/chatService";

const UserSearch = ({ onSelectChat }: any) => {
  const { user } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));

      setUsers(data);
    });

    return () => unsub();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartChat = async (targetUser: any) => {
    if (!user || targetUser.uid === user.uid) return;

    const chatId = await createOrGetChat(user, targetUser);

    onSelectChat({
      id: chatId,
      recipientId: targetUser.uid,
      recipientName: targetUser.displayName,
      recipientPhoto: targetUser.photoURL,
    });
  };

  return (
    <div style={{ padding: "10px" }}>
      <input
        type="text"
        placeholder="Buscar usuário..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "10px",
        }}
      />

      <div>
        {filteredUsers.map((u) => (
          <div
            key={u.uid}
            onClick={() => handleStartChat(u)}
            style={{
              display: "flex",
              gap: "10px",
              padding: "8px",
              cursor: "pointer",
            }}
          >
            <img
              src={u.photoURL || "https://via.placeholder.com/40"}
              width={32}
              height={32}
              style={{ borderRadius: "50%" }}
            />

            <span>{u.displayName || "Usuário"}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSearch;