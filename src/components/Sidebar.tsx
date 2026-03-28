import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase"; // Importe o seu db
import { doc, onSnapshot } from "firebase/firestore"; // Importe as funções do Firestore
import { Toast, ConfirmDialog } from "../utils/swal";
import "../styles/sidebar.css";

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // 1. Estado local para os dados "vivos" do usuário
  const [liveUserData, setLiveUserData] = useState<{ photoURL?: string; displayName?: string } | null>(null);

  // 2. Listener em tempo real para o documento do usuário
  useEffect(() => {
    if (!user?.uid) return;

    // Escuta mudanças no documento do Firestore na coleção 'users'
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setLiveUserData(docSnap.data());
      }
    });

    return () => unsub(); // Limpa o listener ao desmontar
  }, [user?.uid]);

  const handleLogout = async () => {
    const result = await ConfirmDialog(
      "Sair da Estação?",
      "Você precisará logar novamente para acessar sua estante."
    );

    if (result.isConfirmed) {
      try {
        await logout();
        Toast.fire({
          icon: 'success',
          title: 'Até logo, escritor! 🚪'
        });
        navigate("/login");
      } catch (e) {
        console.error("Erro ao deslogar", e);
        Toast.fire({
          icon: 'error',
          title: 'Houve um erro ao tentar sair.'
        });
      }
    }
  };

  return (
    <aside className="sidebar-container">
      <div className="sidebar-logo" onClick={() => navigate("/")}>
        <span className="logo-emoji">🍪</span>
        <div className="logo-text-wrapper">
          <span className="logo-text">CookieStation</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          Início
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          Meu Perfil
        </NavLink>
        <NavLink to="/create" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          Criar Nova História
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="user-info">
            <img 
              // 3. Usa a foto do Firestore (live) ou o placeholder
              src={liveUserData?.photoURL || user.photoURL || "https://via.placeholder.com/40"} 
              alt="Avatar" 
              className="user-avatar" 
            />
            <div className="user-text">
              <span className="user-name">
                {/* 4. Usa o nome do Firestore (live) ou o do Auth */}
                {liveUserData?.displayName || user.displayName || "Escritor"}
              </span>
              <span className="user-email">{user.email}</span>
            </div>
          </div>
        )}
        <button className="btn-logout" onClick={handleLogout}>
          Deslogar
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;