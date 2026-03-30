import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  orderBy, 
  query, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import LikeButton from "../components/LikeButton";
import Comments from "../components/Comments";
import "../styles/storyView.css";

const StoryView: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [story, setStory] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoryData = async () => {
      if (!id) return;
      try {
        const storyDoc = await getDoc(doc(db, "stories", id));
        if (storyDoc.exists()) {
          const data = storyDoc.data();
          setStory({
            id: storyDoc.id,
            userId: data.userId,
            title: data.title || "Sem título",
            synopsis: data.synopsis || data.description || data.sinopse || "Nenhuma sinopse disponível.",
            coverUrl: data.coverUrl || "",
            genre: data.genre || "Geral"
          });
        }

        const capsRef = collection(db, "stories", id, "chapters");
        const q = query(capsRef, orderBy("createdAt", "asc"));
        const capsSnap = await getDocs(q);
        
        setChapters(capsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Erro ao carregar obra:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryData();
  }, [id]);

  const handleContactAuthor = async () => {
    if (!user || !story) return;
    if (user.uid === story.userId) return;

    const combinedId = [user.uid, story.userId].sort().join("_");

    try {
      const chatRef = doc(db, "chats", combinedId);
      await setDoc(chatRef, {
        participants: [user.uid, story.userId],
        lastUpdate: serverTimestamp(),
        active: true
      }, { merge: true });

      navigate(`/messages`);
    } catch (error) {
      console.error("Erro ao iniciar chat:", error);
    }
  };

  if (loading) return (
    <div className="global-loader">
      <span>🍪</span>
      <p>Abrindo o livro...</p>
    </div>
  );

  if (!story) return (
    <div className="error-container">
      <h1>404</h1>
      <p>Obra não encontrada.</p>
    </div>
  );

  const isOwner = user?.uid === story.userId;
  const totalWords = chapters.reduce((acc, cap) => acc + (cap.wordCount || 0), 0);

  return (
    <div className="story-view-container fade-in">
      <div className="story-hero">
        <div 
          className="story-cover-large" 
          style={{ backgroundImage: `url(${story.coverUrl || 'https://via.placeholder.com/400x600?text=Sem+Capa'})` }} 
        />
        
        <div className="story-info-header">
          <div className="badge-row">
            <span className="genre-badge">{story.genre}</span>
            {id && <LikeButton storyId={id} />}
            <span className="word-count-badge">{totalWords.toLocaleString()} palavras</span>
          </div>
          
          <h1>{story.title}</h1>
          
          <div className="synopsis-box">
             <p className="synopsis-text">{story.synopsis}</p>
          </div>

          <div className="action-buttons">
            <button 
              className={chapters.length > 0 ? "btn-read-now" : "btn-disabled"}
              onClick={() => chapters.length > 0 && navigate(`/story/${id}/read/${chapters[0].id}`)}
              disabled={chapters.length === 0}
            >
              {chapters.length > 0 ? "Começar Leitura" : "Sem capítulos"}
            </button>

            {!isOwner && user && (
              <button className="btn-contact-author" onClick={handleContactAuthor}>
                <span>✉</span> Conversar com Autor
              </button>
            )}

            {isOwner && (
              <>
                <button className="btn-edit-story" onClick={() => navigate(`/edit-story/${id}`)}>
                  <span>✎</span> Editar Livro
                </button>
                <button className="btn-add-chapter" onClick={() => navigate(`/story/${id}/new-chapter`)}>
                  + Adicionar Capítulo
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="story-details-grid">
        <section className="chapters-section">
          <div className="section-header">
            <h2>Índice de Capítulos</h2>
            <span className="chapter-count">{chapters.length} capítulos publicados</span>
          </div>

          <div className="chapters-list">
            {chapters.length > 0 ? (
              chapters.map((cap, index) => (
                <div key={cap.id} className="chapter-row" onClick={() => navigate(`/story/${id}/read/${cap.id}`)}>
                  <div className="cap-info">
                    <span className="cap-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="cap-title">{cap.title}</span>
                  </div>
                  
                  <div className="cap-actions">
                    {isOwner && (
                      <button 
                        className="btn-edit-cap" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/story/${id}/edit-chapter/${cap.id}`);
                        }}
                      >
                        Editar
                      </button>
                    )}
                    <span className="cap-arrow">LER →</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-chapters">
                <p>O autor ainda está preparando o próximo banquete literário.</p>
              </div>
            )}
          </div>
        </section>

        <section className="interaction-section">
          {id && <Comments storyId={id} />}
        </section>
      </div>
    </div>
  );
};

export default StoryView;