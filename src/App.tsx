import { lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Sidebar from "./components/Sidebar";
import PrivateRoute from "./components/PrivateRoute";
import Footer from "./components/Footer";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home"));
const Profile = lazy(() => import("./components/Profile"));
const CreateStory = lazy(() => import("./pages/CreateStory"));
const StoryView = lazy(() => import("./pages/StoryView"));
const EditStory = lazy(() => import("./pages/EditStory")); 
const CreateChapter = lazy(() => import("./pages/CreateChapter"));
const ReadingPage = lazy(() => import("./pages/ReadingPage"));
const Messages = lazy(() => import("./pages/Messages"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  const { loading, user } = useAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  const isFocusPage =
    location.pathname.includes("/read/") ||
    location.pathname.includes("/new-chapter") ||
    location.pathname.includes("/edit-chapter/") ||
    location.pathname.includes("/edit-story/");

  const showSidebar = !isAuthPage && !isFocusPage;

  if (loading) {
    return (
      <div className="global-loader">
        <span>🍪</span>
        <p>Preparando...</p>
      </div>
    );
  }

  return (
    <div className={showSidebar ? "app-with-sidebar" : "app-full-canvas"}>
      {showSidebar && <Sidebar />}

      <main className={showSidebar ? "content-area" : "full-content"}>
        <div className="page-container">
          <Suspense fallback={
            <div className="global-loader">
              <span>☕</span>
              <p>Passando o café...</p>
            </div>
          }>
            <Routes>
              <Route
                path="/login"
                element={user ? <Navigate to="/" replace /> : <Login />}
              />
              <Route
                path="/register"
                element={user ? <Navigate to="/" replace /> : <Register />}
              />

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
                path="/edit-story/:id"
                element={
                  <PrivateRoute>
                    <EditStory />
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

              <Route
                path="/messages"
                element={
                  <PrivateRoute>
                    <Messages />
                  </PrivateRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          {showSidebar && <Footer />}
        </div>
      </main>
    </div>
  );
}