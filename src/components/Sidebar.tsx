// components/Sidebar.tsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Toast, ConfirmDialog } from "../utils/swal"; // Sistema de pop-ups
import "../styles/sidebar.css";

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Diálogo de confirmação para evitar cliques acidentais
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
              src={user.photoURL || "https://via.placeholder.com/40"} 
              alt="Avatar" 
              className="user-avatar" 
            />
            <div className="user-text">
              <span className="user-name">{user.displayName || "Escritor"}</span>
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