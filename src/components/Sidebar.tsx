import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Toast, ConfirmDialog } from "../utils/swal";
import "../styles/sidebar.css";

type UserData = {
  photoURL?: string;
  displayName?: string;
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [liveUserData, setLiveUserData] = useState<UserData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  /* ========================= */
  /* LISTENER TEMPO REAL USER */
  /* ========================= */
  useEffect(() => {
    if (!user?.uid) {
      setLiveUserData(null);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          setLiveUserData(data);
        } else {
          setLiveUserData(null);
        }
      },
      (error) => {
        console.error("Erro ao escutar usuário:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  /* ========================= */
  /* LOGOUT */
  /* ========================= */
  const handleLogout = async () => {
    const result = await ConfirmDialog(
      "Sair da Estação?",
      "Você precisará logar novamente para acessar sua estante."
    );

    if (!result.isConfirmed) return;

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
  };

  /* ========================= */
  /* NAVIGATION */
  /* ========================= */
  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  /* ========================= */
  /* FALLBACK AVATAR */
  /* ========================= */
  const avatar =
    liveUserData?.photoURL ||
    user?.photoURL ||
    "https://ui-avatars.com/api/?name=User&background=6b4f3b&color=fff";

  const name =
    liveUserData?.displayName ||
    user?.displayName ||
    "Escritor";

  /* ========================= */
  /* UI */
  /* ========================= */
  return (
    <>
      {/* BOTÃO HAMBURGUER */}
      <button
        className={`hamburger ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* OVERLAY */}
      {isOpen && (
        <div className="overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar-container ${isOpen ? "open" : ""}`}>
        {/* LOGO */}
        <div className="sidebar-logo" onClick={() => handleNavigate("/")}>
          <span className="logo-emoji">🍪</span>
          <div className="logo-text-wrapper">
            <span className="logo-text">CookieStation</span>
          </div>
        </div>

        {/* NAV */}
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

          <NavLink
            to="/messages"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            Comunidade
          </NavLink>
        </nav>

        {/* FOOTER */}
        <div className="sidebar-footer">
          {user && (
            <div className="user-info">
              <img
                src={avatar}
                alt="Avatar"
                className="user-avatar"
              />

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