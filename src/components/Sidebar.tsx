import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Toast, ConfirmDialog } from "../utils/swal";
import "../styles/sidebar.css";

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [liveUserData, setLiveUserData] = useState<{
    photoURL?: string;
    displayName?: string;
  } | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setLiveUserData(docSnap.data());
      }
    });

    return () => unsub();
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
          icon: "success",
          title: "Até logo, escritor! 🚪",
        });
        navigate("/login");
      } catch (e) {
        console.error("Erro ao deslogar", e);
        Toast.fire({
          icon: "error",
          title: "Houve um erro ao tentar sair.",
        });
      }
    }
  };

  // 👉 Fecha o menu ao navegar
  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* BOTÃO HAMBURGUER */}
      <button
        className={`hamburger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* OVERLAY */}
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}

      <aside className={`sidebar-container ${isOpen ? "open" : ""}`}>
        <div className="sidebar-logo" onClick={() => handleNavigate("/")}>
          <span className="logo-emoji">🍪</span>
          <div className="logo-text-wrapper">
            <span className="logo-text">CookieStation</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            Início
          </NavLink>

          <NavLink
            to="/profile"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            Meu Perfil
          </NavLink>

          <NavLink
            to="/create"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            Criar Nova História
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-info">
              <img
                src={
                  liveUserData?.photoURL ||
                  user.photoURL ||
                  "https://via.placeholder.com/40"
                }
                alt="Avatar"
                className="user-avatar"
              />
              <div className="user-text">
                <span className="user-name">
                  {liveUserData?.displayName ||
                    user.displayName ||
                    "Escritor"}
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
    </>
  );
};

export default Sidebar;