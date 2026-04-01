import { lazy, Suspense, useState, useCallback, useMemo } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AudioProvider, useGlobalAudio, AMBIENCE_TRACKS } from "./context/AudioContext";
import { Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "./components/Sidebar";
import PrivateRoute from "./components/PrivateRoute";
import Footer from "./components/Footer";

const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      window.location.reload();
      return { default: () => null };
    }
  });

const Login = lazyWithRetry(() => import("./pages/Login"));
const Register = lazyWithRetry(() => import("./pages/Register"));
const Home = lazyWithRetry(() => import("./pages/Home"));
const Profile = lazyWithRetry(() => import("./components/Profile"));
const CreateStory = lazyWithRetry(() => import("./pages/CreateStory"));
const StoryView = lazyWithRetry(() => import("./pages/StoryView"));
const EditStory = lazyWithRetry(() => import("./pages/EditStory"));
const StoryManage = lazyWithRetry(() => import("./pages/StoryManage"));
const CreateChapter = lazyWithRetry(() => import("./pages/CreateChapter"));
const ReadingPage = lazyWithRetry(() => import("./pages/ReadingPage"));
const Messages = lazyWithRetry(() => import("./pages/Messages"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const Guidelines = lazyWithRetry(() => import("./pages/Guidelines"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));
const About = lazyWithRetry(() => import("./pages/About"));

function AppContent() {
  const { loading, user } = useAuth();
  const { isAmbiencePlaying, currentTrack, toggleAmbience, changeTrack, playSFX } = useGlobalAudio();
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const location = useLocation();

  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  const isFocusPage = useMemo(() => {
    return (
      (location.pathname.startsWith("/story/") && (
        location.pathname.includes("/read/") ||
        location.pathname.includes("/new-chapter") ||
        location.pathname.includes("/edit-chapter") ||
        location.pathname.includes("/manage")
      )) ||
      location.pathname.startsWith("/edit-story/") ||
      ["/guidelines", "/privacy", "/about"].includes(location.pathname)
    );
  }, [location.pathname]);

  const showSidebar = !isAuthPage && !isFocusPage;

  const handleTrackChange = useCallback((trackPath: string) => {
    changeTrack(trackPath);
    setShowMusicMenu(false);
    playSFX("/sounds/click.mp3");
  }, [changeTrack, playSFX]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMusicMenu(prev => !prev);
  };

  if (loading) {
    return (
      <div className="global-loader">
        <span>🍪</span>
        <p>Preparando...</p>
      </div>
    );
  }

  return (
    <div
      className={showSidebar ? "app-with-sidebar" : "app-full-canvas"}
      onClick={() => showMusicMenu && setShowMusicMenu(false)}
    >
      {showSidebar && <Sidebar />}

      {!isAuthPage && (
        <div className="audio-controls-wrapper" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence>
            {showMusicMenu && (
              <motion.div
                className="music-menu"
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.9 }}
              >
                <button onClick={toggleAmbience}>
                  {isAmbiencePlaying ? "🔇 Desligar Música" : "🔊 Ligar Música"}
                </button>

                <button
                  onClick={() => handleTrackChange(AMBIENCE_TRACKS.TRACK_1)}
                  className={currentTrack === AMBIENCE_TRACKS.TRACK_1 ? "active" : ""}
                >
                  Tulip
                </button>

                <button
                  onClick={() => handleTrackChange(AMBIENCE_TRACKS.TRACK_2)}
                  className={currentTrack === AMBIENCE_TRACKS.TRACK_2 ? "active" : ""}
                >
                  Orchid
                </button>

                <button
                  onClick={() => handleTrackChange(AMBIENCE_TRACKS.TRACK_3)}
                  className={currentTrack === AMBIENCE_TRACKS.TRACK_3 ? "active" : ""}
                >
                  Sunflower
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            className={`btn-audio-toggle ${isAmbiencePlaying ? "playing" : ""}`}
            onClick={handleButtonClick}
          >
            {isAmbiencePlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        </div>
      )}

      <main className={showSidebar ? "content-area" : "full-content"}>
        <div className="page-container">
          <Suspense
            fallback={
              <div className="global-loader">
                <span>☕</span>
                <p>Passando o café...</p>
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
              <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

              <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/profile/:userId" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/create" element={<PrivateRoute><CreateStory /></PrivateRoute>} />
              <Route path="/story/:id" element={<PrivateRoute><StoryView /></PrivateRoute>} />
              <Route path="/edit-story/:id" element={<PrivateRoute><EditStory /></PrivateRoute>} />
              <Route path="/story/:storyId/manage" element={<PrivateRoute><StoryManage /></PrivateRoute>} />
              <Route path="/story/:id/read/:chapterId" element={<PrivateRoute><ReadingPage /></PrivateRoute>} />
              <Route path="/story/:storyId/new-chapter" element={<PrivateRoute><CreateChapter /></PrivateRoute>} />
              <Route path="/story/:storyId/edit-chapter/:chapterId" element={<PrivateRoute><CreateChapter /></PrivateRoute>} />
              <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />

              <Route path="/guidelines" element={<Guidelines />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          {showSidebar && <Footer />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <AppContent />
    </AudioProvider>
  );
}