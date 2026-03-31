import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalAudio } from "../context/AudioContext"; 
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

const Home: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState("Todos");
  const navigate = useNavigate();
  const { playSFX } = useGlobalAudio();

  const genres = useMemo(() => ["Todos", "Fantasia", "Suspense", "Romance", "Terror", "Conto"], []);

  const handleStoryClick = useCallback((id: string) => {
    playSFX("/sounds/pageflip.mp3");
    navigate(`/story/${id}`);
  }, [navigate, playSFX]);

  useEffect(() => {
    setLoading(true);
    const storiesRef = collection(db, "stories");
    
    let q;
    if (activeGenre === "Todos") {
      q = query(
        storiesRef,
        where("visibility", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(12)
      );
    } else {
      q = query(
        storiesRef,
        where("visibility", "==", "public"),
        where("genre", "==", activeGenre),
        orderBy("createdAt", "desc"),
        limit(12)
      );
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          wordCount: Number(docData.wordCount || 0),
          views: Number(docData.views || 0),
          authorName: docData.authorName || "Escritor Anônimo",
          title: docData.title || "Sem Título",
          genre: docData.genre || "Conto"
        } as Story;
      });

      setStories(data);
      setLoading(false);
    }, (error) => {
      console.error("Erro na Estação de Dados:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeGenre]);

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
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
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
                      <p className="card-author-name">
                        por <span>{story.authorName}</span>
                      </p>
                      <div className="card-meta">
                        <span>{story.wordCount.toLocaleString('pt-BR')} palavras</span>
                        <span className="dot">•</span>
                        <span className="card-stats">
                            👁️ {story.views.toLocaleString('pt-BR')}
                        </span>
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