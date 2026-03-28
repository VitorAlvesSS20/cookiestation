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
  words?: number;
}

const Home: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPublicStories = async () => {
    try {
      const q = query(
        collection(db, "stories"), 
        where("visibility", "==", "public"),
        orderBy("createdAt", "desc"), 
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Story[];
      setStories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicStories();
  }, []);

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
          <div className="divider-line"></div>
        </div>

        {loading ? (
          <div className="loading-state">☕ Moendo os grãos...</div>
        ) : (
          <div className="stories-grid">
            {stories.map((story) => (
              <div key={story.id} className="story-card" onClick={() => navigate(`/story/${story.id}`)}>
                <div 
                  className="card-image"
                  style={{ backgroundImage: `url(${story.coverUrl || '/livro.jpg'})` }}
                />
                <div className="card-content">
                  <div className="card-author">
                    <span>Por {story.authorName}</span>
                  </div>
                  <h3>{story.title || "História Sem Título"}</h3>
                  <div className="card-meta">
                    <span>{story.words || 0} palavras</span>
                    <span className="dot">•</span>
                    <span>{story.createdAt?.toDate().toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;