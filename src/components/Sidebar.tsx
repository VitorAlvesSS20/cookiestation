import React, { useEffect, useState, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Toast, ConfirmDialog } from "../utils/swal";
import "../styles/sidebar.css";

type UserData = {
  photoURL?: string;
  displayName?: string;
  online?: boolean;
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Útil para monitorar mudanças de rota

  const [liveUserData, setLiveUserData] = useState<UserData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  /* ========================= */
  /* 🔥 LISTENER TEMPO REAL USER */
  /* ========================= */
  useEffect(() => {
    // Se não houver usuário logado, limpa o estado e não tenta buscar no DB
    // Isso evita o erro de "Missing or Insufficient Permissions" no console
    if (!user?.uid) {
      setLiveUserData(null);
      return;
    }

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setLiveUserData(docSnap.data() as UserData);
        }
      },
      (error) => {
        // Erro silencioso se for permissão (comum no logout), mas loga outros
        if (error.code !== "permission-denied") {
          console.error("Erro ao escutar usuário:", error);
        }
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Fecha o menu automaticamente quando a rota mudar (Mobile UX)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  /* ========================= */
  /* 🚪 LOGOUT */
  /* ========================= */
  const handleLogout = async () => {
    const result = await ConfirmDialog(
      "Sair da Estação?",
      "Você precisará logar novamente para acessar sua estante."
    );

    if (!result.isConfirmed) return;

    try {
      setIsOpen(false);
      await logout();
      Toast.fire({
        icon: "success",
        title: "Até logo, escritor! 🚪",
      });
      navigate("/login");
    } catch (e) {
      console.error("Erro ao deslogar", e);
      Toast.fire({ icon: "error", title: "Houve um erro ao tentar sair." });
    }
  };

  /* ========================= */
  /* 🧠 MEMOIZED VALUES (Performance) */
  /* ========================= */
  const avatar = useMemo(() => 
    liveUserData?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || "User"}&background=6b4f3b&color=fff`,
    [liveUserData?.photoURL, user?.photoURL, user?.displayName]
  );

  const name = liveUserData?.displayName || user?.displayName || "Escritor";
  const isOnline = liveUserData?.online ?? false;

  return (
    <>
      {/* 🍔 BOTÃO HAMBURGUER - Acessibilidade: aria-label */}
      <button
        className={`hamburger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir menu"
      >
        <span />
        <span />
        <span />
      </button>

      {/* 🌑 OVERLAY - Com animação de fade via CSS se desejar */}
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar-container ${isOpen ? "open" : ""}`}>
        {/* 🍪 LOGO */}
        <div className="sidebar-logo" onClick={() => navigate("/")} role="button">
          <span className="logo-emoji">🍪</span>
          <div className="logo-text-wrapper">
            <span className="logo-text">CookieStation</span>
          </div>
        </div>

        {/* 📚 NAV - Organizado por lista para melhor SEO/Acessibilidade */}
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Início
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Meu Perfil
          </NavLink>

          <NavLink to="/create" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Criar Nova História
          </NavLink>

          <NavLink to="/messages" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Comunidade
          </NavLink>
        </nav>

        {/* 👤 FOOTER */}
        <div className="sidebar-footer">
          {user && (
            <div className="user-info">
              <div className="avatar-wrapper">
                <img src={avatar} alt="Seu Avatar" className="user-avatar" />
                <span className={`status-dot ${isOnline ? "online" : "offline"}`} title={isOnline ? "Online" : "Offline"} />
              </div>

              <div className="user-text">
                <span className="user-name">{name}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
          )}

          <button className="btn-logout" onClick={handleLogout}>
            Deslogar
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;