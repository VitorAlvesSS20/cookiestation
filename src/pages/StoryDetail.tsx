import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStory, updateStory, deleteStory } from "../services/stories";
import { useAuth } from "../context/AuthContext";
import type { Story } from "../types";
import "../styles/storyDetail.css";

const StoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStory = async () => {
      if (!id) return;
      const data = await getStory(id);
      if (data) {
        setStory(data as Story);
        setTitle(data.title);
        setContent(data.content);
      }
    };
    fetchStory();
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    setLoading(true);
    try {
      await updateStory(id, title, content);
      navigate("/");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Deseja mesmo descartar esta história? ☕")) return;
    await deleteStory(id);
    navigate("/");
  };

  if (!story) {
    return (
      <div className="loading-container">
        <div className="coffee-loader">☕</div>
        <p>Moendo os grãos da sua história...</p>
      </div>
    );
  }

  const isOwner = user?.uid === story.userId;

  return (
    <div className="detail-page">
      <div className={`detail-card ${!isOwner ? 'view-mode' : 'edit-mode'}`}>
        <header className="detail-header">
          <button className="back-btn" onClick={() => navigate("/")}>
            ← Voltar para o Menu
          </button>
          <div className="header-info">
            <span className="author-badge">📝 {isOwner ? "Sua Obra" : `Escrito por um Cliente`}</span>
          </div>
        </header>

        <main className="detail-main">
          <div className="input-field">
            <label className="field-label">Título</label>
            <input
              className="detail-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isOwner}
              placeholder="Título da história"
            />
          </div>

          <div className="input-field">
            <label className="field-label">Manuscrito</label>
            <textarea
              className="detail-content-area"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!isOwner}
              placeholder="Era uma vez..."
            />
          </div>
        </main>

        {isOwner && (
          <footer className="detail-actions">
            <button className="delete-btn" onClick={handleDelete}>
              Deletar História
            </button>
            <button className="save-btn" onClick={handleUpdate} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações 🍪"}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

export default StoryDetail;