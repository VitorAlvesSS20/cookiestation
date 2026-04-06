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
  serverTimestamp,
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
            ...data,
            synopsis:
              data.synopsis || data.sinopse || "Nenhuma sinopse disponível.",
          });
        }

        const capsRef = collection(db, "stories", id, "chapters");
        const q = query(capsRef, orderBy("createdAt", "asc"));
        const capsSnap = await getDocs(q);

        setChapters(
          capsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
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
      await setDoc(
        chatRef,
        {
          participants: [user.uid, story.userId],
          lastUpdate: serverTimestamp(),
          active: true,
        },
        { merge: true },
      );

      navigate(`/messages`);
    } catch (error) {
      console.error("Erro ao iniciar chat:", error);
    }
  };

  const getRatingClass = (rating: string) => {
    const r = rating?.replace("+", "");
    if (r === "Livre") return "rating-l";
    if (parseInt(r) >= 18) return "rating-18";
    if (parseInt(r) >= 16) return "rating-16";
    return "rating-general";
  };

  if (loading)
    return (
      <div className="global-loader">
        <span>☕</span>
        <p>Servindo sua história...</p>
      </div>
    );

  if (!story)
    return (
      <div className="error-container">
        <h1>404</h1>
        <p>Obra não encontrada.</p>
      </div>
    );

  const isOwner = user?.uid === story.userId;
  const totalWords = chapters.reduce(
    (acc, cap) => acc + (cap.wordCount || 0),
    0,
  );

  return (
    <div className="story-view-container fade-in">
      <div className="story-hero">
        <div
          className="hero-background"
          style={{ backgroundImage: `url(${story.coverUrl})` }}
        />

        <div className="story-hero-content">
          <div className="story-cover-wrapper">
            <img
              src={
                story.coverUrl ||
                "https://via.placeholder.com/400x600?text=Sem+Capa"
              }
              alt={story.title}
              className="story-cover-large"
            />
            {story.rating && (
              <div
                className={`rating-badge-float ${getRatingClass(story.rating)}`}
              >
                {story.rating}
              </div>
            )}
          </div>

          <div className="story-info-header">
            <div className="badge-row">
              <span
                className={`status-badge ${story.status?.toLowerCase().replace(" ", "-")}`}
              >
                {story.status || "Em andamento"}
              </span>
              {Array.isArray(story.genres) ? (
                story.genres.map((g: string) => (
                  <span key={g} className="genre-badge">
                    {g}
                  </span>
                ))
              ) : (
                <span className="genre-badge">{story.genre || "Geral"}</span>
              )}
              <span className="word-count-badge">
                {totalWords.toLocaleString()} palavras
              </span>
            </div>

            <h1 className="story-title-display">{story.title}</h1>
            <p className="author-name-display">
              por <span>{story.authorName || "Autor Desconhecido"}</span>
            </p>

            <div className="stats-row-simple">
              <div className="stat-item">
                <span>👁</span> {story.views || 0}
              </div>
              <div className="stat-item">
                <span>📑</span> {chapters.length} Caps
              </div>
              {id && <LikeButton storyId={id} />}
            </div>

            <div className="synopsis-box">
              <p className="synopsis-text">{story.synopsis}</p>
            </div>

            {story.tags && story.tags.length > 0 && (
              <div className="tags-container-view">
                {story.tags.map((tag: string) => (
                  <span key={tag} className="tag-item">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="action-buttons">
              <button
                className={
                  chapters.length > 0 ? "btn-read-now" : "btn-disabled"
                }
                onClick={() =>
                  chapters.length > 0 &&
                  navigate(`/story/${id}/read/${chapters[0].id}`)
                }
                disabled={chapters.length === 0}
              >
                {chapters.length > 0 ? "Começar Leitura" : "Sem capítulos"}
              </button>

              {!isOwner && user && (
                <button
                  className="btn-contact-author"
                  onClick={handleContactAuthor}
                >
                  ✉ Conversar
                </button>
              )}

              {isOwner && (
                <div className="owner-actions">
                  <button
                    className="btn-edit-story"
                    onClick={() => navigate(`/edit-story/${id}`)}
                  >
                    ✎ Editar
                  </button>
                  <button
                    className="btn-add-chapter"
                    onClick={() => navigate(`/story/${id}/new-chapter`)}
                  >
                    + Capítulo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="story-details-grid">
        <section className="chapters-section">
          <div className="section-header">
            <h2>Índice de Capítulos</h2>
            <span className="chapter-count">
              {chapters.length} capítulos publicados
            </span>
          </div>

          <div className="chapters-list">
            {chapters.length > 0 ? (
              chapters.map((cap, index) => (
                <div
                  key={cap.id}
                  className="chapter-row"
                  onClick={() => navigate(`/story/${id}/read/${cap.id}`)}
                >
                  <div className="cap-info">
                    <span className="cap-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="cap-title-wrapper">
                      <span className="cap-title">{cap.title}</span>
                      <span className="cap-date">
                        {new Date(
                          cap.createdAt?.seconds * 1000,
                        ).toLocaleDateString()}
                      </span>
                    </div>
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
                <p>
                  O autor ainda está preparando o próximo banquete literário. 🍪
                </p>
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
