import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
} from "firebase/firestore";
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
  genres: string[];
  views: number;
  visibility: string;
}

const GENRES = [
  "Ação",
  "Aventura",
  "Comédia",
  "Conto",
  "Drama",
  "Fantasia",
  "Ficção Científica",
  "Mistério",
  "Romance",
  "Suspense",
  "Terror",
  "Sobrenatural",
];

const Home: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const navigate = useNavigate();
  const { playSFX } = useGlobalAudio();

  const handleStoryClick = useCallback(
    (id: string) => {
      playSFX("/sounds/pageflip.mp3");
      navigate(`/story/${id}`);
    },
    [navigate, playSFX],
  );

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const clearGenres = () => {
    setSelectedGenres([]);
  };

  useEffect(() => {
    setLoading(true);
    const storiesRef = collection(db, "stories");

    const q = query(
      storiesRef,
      where("visibility", "==", "public"),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => {
          const docData = doc.data();

          const genres = Array.isArray(docData.genres)
            ? docData.genres
            : typeof docData.genre === "string"
              ? [docData.genre]
              : ["Conto"];

          return {
            id: doc.id,
            ...docData,
            wordCount: Number(docData.totalWords ?? 0),
            views: Number(docData.views || 0),
            authorName: docData.authorName || "Escritor Anônimo",
            title: docData.title || "Sem Título",
            genres,
          } as Story;
        });

        let filtered = data;

        if (selectedGenres.length > 0) {
          filtered = data.filter(
            (story) =>
              Array.isArray(story.genres) &&
              selectedGenres.every((g) => story.genres.includes(g)),
          );
        }

        setStories(filtered.slice(0, 12));
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [selectedGenres]);

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
            <h1>
              Sua próxima história favorita <br /> <span>começa aqui.</span>
            </h1>
            <p>
              Explore mundos criados por escritores independentes e mergulhe em
              narrativas únicas.
            </p>
            <div className="hero-actions">
              <button
                className="btn-primary-home"
                onClick={() => navigate("/create")}
              >
                Escrever Minha Obra
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <nav className="genre-nav">
        <button
          className={`genre-tab ${selectedGenres.length === 0 ? "active" : ""}`}
          onClick={clearGenres}
        >
          Todos
        </button>

        {GENRES.map((genre) => (
          <button
            key={genre}
            className={`genre-tab ${
              selectedGenres.includes(genre) ? "active" : ""
            }`}
            onClick={() => toggleGenre(genre)}
          >
            {genre}
          </button>
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
              key={selectedGenres.join(",")}
              layout
              className="stories-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              {stories.length > 0 ? (
                stories.map((story) => (
                  <motion.article
                    key={story.id}
                    layout
                    whileHover={{ y: -8 }}
                    className="story-card"
                    onClick={() => handleStoryClick(story.id)}
                  >
                    <div className="card-image-wrapper">
                      <img
                        src={
                          story.coverUrl ||
                          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c"
                        }
                        alt={story.title}
                        className="card-image"
                        loading="lazy"
                      />
                      <div className="card-badge">
                        {story.genres.slice(0, 2).join(" • ")}
                      </div>
                    </div>

                    <div className="card-content">
                      <h3>{story.title}</h3>
                      <p className="card-author-name">
                        por <span>{story.authorName}</span>
                      </p>
                      <div className="card-meta">
                        <span>
                          {story.wordCount.toLocaleString("pt-BR")} palavras
                        </span>
                        <span className="dot">•</span>
                        <span className="card-stats">
                          👁️ {story.views.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                ))
              ) : (
                <motion.div className="empty-state">
                  <p>Nenhuma história encontrada. ☕</p>
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
