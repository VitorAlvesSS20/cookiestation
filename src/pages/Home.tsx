import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
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
  views?: number;
}

const Home: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState("Todos");
  const navigate = useNavigate();

  const genres = ["Todos", "Fantasia", "Suspense", "Romance", "RPG", "Conto"];

  const fetchStories = useCallback(async (genreFilter: string) => {
    setLoading(true);
    try {
      const storiesRef = collection(db, "stories");
      let q = query(
        storiesRef,
        where("visibility", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(12)
      );

      if (genreFilter !== "Todos") {
        q = query(
          storiesRef,
          where("visibility", "==", "public"),
          where("genre", "==", genreFilter),
          orderBy("createdAt", "desc"),
          limit(12)
        );
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          // Fallbacks de segurança para evitar erros de renderização
          wordCount: docData.wordCount || 0,
          authorName: docData.authorName || "Escritor Anônimo",
          title: docData.title || "Sem Título",
          views: docData.views || 0,
          genre: docData.genre || "Conto"
        };
      }) as Story[];

      setStories(data);
    } catch (error) {
      console.error("Erro na Estação:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories(activeGenre);
  }, [activeGenre, fetchStories]);

  return (
    <div className="home-container">
      <section className="hero-banner">
        <div className="hero-overlay">
          <div className="hero-content">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Sua próxima história favorita <br /> <span>começa aqui.</span>
            </motion.h1>
            <p>Explore mundos criados por escritores independentes.</p>
            <div className="hero-actions">
              <button className="btn-primary-home" onClick={() => navigate("/create")}>
                Escrever Minha Obra
              </button>
            </div>
          </div>
        </div>
      </section>

      <nav className="genre-nav" style={{ display: 'flex', gap: '15px', marginBottom: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {genres.map(genre => (
          <button 
            key={genre}
            className={`genre-tab ${activeGenre === genre ? 'active' : ''}`}
            onClick={() => setActiveGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </nav>

      <main className="feed-main">
        {loading ? (
          <div className="stories-grid">
            {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="skeleton-card" />)}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeGenre}
              layout 
              className="stories-grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {stories.length > 0 ? (
                stories.map((story) => (
                  <article 
                    key={story.id} 
                    className="story-card" 
                    onClick={() => navigate(`/story/${story.id}`)}
                  >
                    <div className="card-image-wrapper">
                      <img 
                        src={story.coverUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c"} 
                        alt={story.title} 
                        className="card-image"
                        loading="lazy" 
                      />
                      <div className="card-badge" style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--cookie-gold)', color: 'var(--mocha-dark)', padding: '5px 12px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                        {story.genre}
                      </div>
                    </div>
                    
                    <div className="card-content">
                      <div className="card-author">
                        <span>{story.genre}</span>
                      </div>
                      <h3>{story.title}</h3>
                      <p className="card-author" style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-body)' }}>
                        por <span style={{ color: 'var(--cookie-gold)' }}>{story.authorName}</span>
                      </p>
                      <div className="card-meta">
                        <span>{(story.wordCount).toLocaleString()} palavras</span>
                        <span className="dot">•</span>
                        <span className="card-stats">
                           👁️ {story.views}
                        </span>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  <p>Nenhuma história encontrada nesta categoria. ☕</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default Home;