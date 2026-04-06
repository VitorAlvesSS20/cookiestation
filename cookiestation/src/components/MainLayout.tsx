import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import "../styles/App.css";

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="global-loader">Sincronizando com a CookieStation...</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout-container">
      <Sidebar />

      <main className="main-content-area">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
