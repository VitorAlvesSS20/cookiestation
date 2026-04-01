import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalAudio } from "../context/AudioContext";
import { useAuth } from "../context/AuthContext";
import "../styles/home.css";

interface Story {
  id: string;
  title: string;
  coverUrl: string;
  authorName: string;
  userId: string;
  createdAt: any;
  wordCount: number;
  genre: string;
  views: number;
  visibility: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const Home: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState("Todos");
  const navigate = useNavigate();
  const { playSFX } = useGlobalAudio();
  const { user } = useAuth();

  const genres = useMemo(() => ["Todos", "Fantasia", "Suspense", "Romance", "Terror", "Conto"], []);

  const handleStoryClick = useCallback((id: string) => {
    playSFX("/sounds/pageflip.mp3");
    navigate(`/story/${id}`);
  }, [navigate, playSFX]);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const genreParam = activeGenre !== "Todos" ? `?genre=${activeGenre}` : "";
      const response = await fetch(`${API_URL}/stories${genreParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedData = data.map((story: any) => ({
          ...story,
          wordCount: Number(story.wordCount || 0),
          views: Number(story.views || 0),
          authorName: story.authorName || "Escritor Anônimo",
          title: story.title || "Sem Título",
          genre: story.genre || "Conto"
        }));
        setStories(formattedData);
      }
    } catch (error) {
      console.error("Erro na Estação de Dados:", error);
    } finally {
      setLoading(false);
    }
  }, [activeGenre, user]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return (
    <motion.div 
      className="home-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <section className="hero-banner">
        <div className="hero-overlay">
          <motion.div 
            className="hero-content"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h1>Sua próxima história favorita <br /> <span>começa aqui.</span></h1>
            <p>Explore mundos criados por escritores independentes e mergulhe em narrativas únicas.</p>
            <div className="hero-actions">
              <button className="btn-primary-home" onClick={() => navigate("/create")}>
                Escrever Minha Obra
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <nav className="genre-nav">
        {genres.map((genre, index) => (
          <motion.button 
            key={genre}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`genre-tab ${activeGenre === genre ? 'active' : ''}`}
            onClick={() => setActiveGenre(genre)}
          >
            {genre}
          </motion.button>
        ))}
      </nav>

      <main className="feed-main">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              className="stories-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}
            </motion.div>
          ) : (
            <motion.div 
              key={activeGenre}
              layout 
              className="stories-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {stories.length > 0 ? (
                stories.map((story) => (
                  <motion.article 
                    key={story.id} 
                    layout
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="story-card" 
                    onClick={() => handleStoryClick(story.id)}
                  >
                    <div className="card-image-wrapper">
                      <img 
                        src={story.coverUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c"} 
                        alt={story.title} 
                        className="card-image"
                        loading="lazy" 
                      />
                      <div className="card-badge">{story.genre}</div>
                    </div>
                    <div className="card-content">
                      <h3>{story.title}</h3>
                      <p className="card-author-name">por <span>{story.authorName}</span></p>
                      <div className="card-meta">
                        <span>{story.wordCount.toLocaleString('pt-BR')} palavras</span>
                        <span className="dot">•</span>
                        <span className="card-stats">👁️ {story.views.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </motion.article>
                ))
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="empty-state"
                >
                  <p>Nenhuma história encontrada nesta categoria. ☕</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
};

export default Home;