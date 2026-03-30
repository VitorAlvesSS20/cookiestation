import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import "../styles/home.css";

interface Story {
  id: string;
  title: string;
  coverUrl: string;
  authorName: string;
  userId: string;
  createdAt: any;
  wordCount?: number;
  genre?: string;
}

const Home: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPublicStories = async () => {
    try {
      const storiesRef = collection(db, "stories");
      
      const q = query(
        storiesRef,
        where("visibility", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          authorName: docData.authorName || "Escritor Anônimo",
          title: docData.title || "História Sem Título",
          coverUrl: docData.coverUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
          wordCount: docData.wordCount || 0,
          genre: docData.genre || "Conto"
        };
      }) as Story[];

      setStories(data);
    } catch (error) {
      console.error("Erro ao buscar histórias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicStories();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Recentemente";
    try {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    } catch (e) {
      return "Recentemente";
    }
  };

  return (
    <div className="home-container fade-in">
      <section className="hero-banner">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1>Sua próxima história favorita começa aqui.</h1>
            <p>Explore mundos criados por escritores independentes na nossa estação.</p>
            <button className="btn-primary-home" onClick={() => navigate("/create")}>
              Começar a Escrever
            </button>
          </div>
        </div>
      </section>

      <main className="feed-main">
        <div className="section-header">
          <h2>Recém Saídas</h2>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loader-mocha"></div>
            <p>Moendo os grãos...</p>
          </div>
        ) : (
          <div className="stories-grid">
            {stories.length > 0 ? (
              stories.map((story) => (
                <article 
                  key={story.id} 
                  className="story-card" 
                  onClick={() => navigate(`/story/${story.id}`)}
                >
                  <div className="card-image-wrapper">
                    <div 
                      className="card-image"
                      style={{ 
                        backgroundImage: `url(${story.coverUrl})` 
                      }}
                      aria-label={`Capa de ${story.title}`}
                    />
                  </div>
                  
                  <div className="card-content">
                    <div className="card-author">
                      <span>{story.genre} • Por {story.authorName}</span>
                    </div>
                    <h3>{story.title}</h3>
                    <div className="card-meta">
                      <span>{(story.wordCount || 0).toLocaleString()} palavras</span>
                      <span className="dot">•</span>
                      <span>{formatDate(story.createdAt)}</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-feed" style={{ textAlign: 'center', gridColumn: '1/-1', padding: '50px' }}>
                <p style={{ color: '#8B7E74', fontWeight: 'bold' }}>
                  Nenhuma história pública encontrada na estação ainda. ☕
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;