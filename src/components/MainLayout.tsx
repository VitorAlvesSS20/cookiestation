// components/MainLayout.tsx
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import "../styles/App.css"; // Usa o CSS global do Step 1

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();

  // Enquanto carrega o estado do Firebase, mostra um loader em tela cheia
  if (loading) {
    return <div className="global-loader">Sincronizando com a CookieStation...</div>;
  }

  // Se não estiver logado, redireciona para o Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout-container">
      {/* Sidebar fixo à esquerda */}
      <Sidebar />
      
      {/* Área onde as páginas (Home, Profile, etc) vão aparecer */}
      <main className="main-content-area">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;