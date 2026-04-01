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
  const location = useLocation(); 

  const [liveUserData, setLiveUserData] = useState<UserData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

 
 
 
  useEffect(() => {
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
        if (error.code !== "permission-denied") {
          console.error("Erro ao escutar usuário:", error);
        }
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

 
 
 
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

 
 
 
  const avatar = useMemo(() => 
    liveUserData?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || "User"}&background=6b4f3b&color=fff`,
    [liveUserData?.photoURL, user?.photoURL, user?.displayName]
  );

  const name = liveUserData?.displayName || user?.displayName || "Escritor";
  const isOnline = liveUserData?.online ?? false;

  return (
    <>
      <button
        className={`hamburger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir menu"
      >
        <span />
        <span />
        <span />
      </button>

      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar-container ${isOpen ? "open" : ""}`}>
        {/* 🍪 LOGO */}
        <div className="sidebar-logo" onClick={() => navigate("/")} role="button">
          <span className="logo-emoji">🍪</span>
          <div className="logo-text-wrapper">
            <span className="logo-text">CookieStation</span>
          </div>
        </div>

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