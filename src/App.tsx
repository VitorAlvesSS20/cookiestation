import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Sidebar from "./components/Sidebar";
import PrivateRoute from "./components/PrivateRoute";
import Footer from "./components/Footer";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Home from "./pages/Home";
import Profile from "./components/Profile";
import CreateStory from "./pages/CreateStory";
import StoryView from "./pages/StoryView";

import CreateChapter from "./pages/CreateChapter";
import ReadingPage from "./pages/ReadingPage";

// 🌎 COMUNIDADE (Messages = Chat público)
import Messages from "./pages/Messages";

export default function App() {
  const { loading, user } = useAuth();
  const location = useLocation();

  /* ========================= */
  /* PAGE CONTROLS */
  /* ========================= */

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  const isFocusPage =
    location.pathname.includes("/read/") ||
    location.pathname.includes("/new-chapter") ||
    location.pathname.includes("/edit-chapter/");

  const showSidebar = !isAuthPage && !isFocusPage;

  /* ========================= */
  /* LOADING GLOBAL */
  /* ========================= */
  if (loading) {
    return (
      <div className="global-loader">
        <span style={{ fontSize: "2rem" }}>🍪</span>
        <p>Preparando...</p>
      </div>
    );
  }

  return (
    <div className={showSidebar ? "app-with-sidebar" : "app-full-canvas"}>
      {/* ========================= */}
      {/* SIDEBAR */}
      {/* ========================= */}
      {showSidebar && <Sidebar />}

      <main className={showSidebar ? "content-area" : "full-content"}>
        <div className="page-container">
          <Routes>
            {/* ========================= */}
            {/* AUTH */}
            {/* ========================= */}
            <Route
              path="/login"
              element={user ? <Navigate to="/" /> : <Login />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to="/" /> : <Register />}
            />

            {/* ========================= */}
            {/* APP */}
            {/* ========================= */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            <Route
              path="/create"
              element={
                <PrivateRoute>
                  <CreateStory />
                </PrivateRoute>
              }
            />

            <Route
              path="/story/:id"
              element={
                <PrivateRoute>
                  <StoryView />
                </PrivateRoute>
              }
            />

            <Route
              path="/story/:id/read/:chapterId"
              element={
                <PrivateRoute>
                  <ReadingPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/story/:storyId/new-chapter"
              element={
                <PrivateRoute>
                  <CreateChapter />
                </PrivateRoute>
              }
            />

            <Route
              path="/story/:storyId/edit-chapter/:chapterId"
              element={
                <PrivateRoute>
                  <CreateChapter />
                </PrivateRoute>
              }
            />

            {/* ========================= */}
            {/* 🌎 COMUNIDADE */}
            {/* ========================= */}
            <Route
              path="/messages"
              element={
                <PrivateRoute>
                  <Messages />
                </PrivateRoute>
              }
            />

            {/* ========================= */}
            {/* FALLBACK */}
            {/* ========================= */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

          {/* ========================= */}
          {/* FOOTER */}
          {/* ========================= */}
          {showSidebar && <Footer />}
        </div>
      </main>
    </div>
  );
}