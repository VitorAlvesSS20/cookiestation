import { lazy, Suspense, useState, useCallback, useMemo } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AudioProvider, useGlobalAudio, AMBIENCE_TRACKS } from "./context/AudioContext";
import { Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
const Guidelines = lazy(() => import("./pages/Guidelines"));
const Privacy = lazy(() => import("./pages/Privacy"));
const About = lazy(() => import("./pages/About"));

function AppContent() {
  const { loading, user } = useAuth();
  const { isAmbiencePlaying, currentTrack, toggleAmbience, changeTrack, playSFX } = useGlobalAudio();
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const location = useLocation();

  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  const isFocusPage = useMemo(() => {
    return (
      location.pathname.startsWith("/read/") ||
      location.pathname.includes("/new-chapter") ||
      location.pathname.includes("/edit-chapter") ||
      location.pathname.includes("/edit-story") ||
      ["/guidelines", "/privacy", "/about"].includes(location.pathname)
    );
  }, [location.pathname]);

  const showSidebar = !isAuthPage && !isFocusPage;

  const handleTrackChange = useCallback((trackPath: string) => {
    changeTrack(trackPath);
    setShowMusicMenu(false);
    playSFX("/sounds/click.mp3");
  }, [changeTrack, playSFX]);

  const handleButtonClick = () => {
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
              <Route path="/create" element={<PrivateRoute><CreateStory /></PrivateRoute>} />
              <Route path="/story/:id" element={<PrivateRoute><StoryView /></PrivateRoute>} />
              <Route path="/edit-story/:id" element={<PrivateRoute><EditStory /></PrivateRoute>} />
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