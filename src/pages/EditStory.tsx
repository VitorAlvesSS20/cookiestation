import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/storyDetail.css";

const API_URL = import.meta.env.VITE_API_URL;

const EditStory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [genre, setGenre] = useState("Geral");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchStory = async () => {
      if (!id || !user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${API_URL}/stories/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (user.uid !== data.userId) {
            navigate("/");
            return;
          }
          setTitle(data.title || "");
          setSynopsis(data.synopsis || "");
          setCoverUrl(data.coverUrl || "");
          setGenre(data.genre || "Geral");
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Erro ao buscar história:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchStory();
  }, [id, user, navigate]);

  const handleUpdate = async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/stories/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, synopsis, coverUrl, genre })
      });

      if (response.ok) {
        navigate(`/story/${id}`);
      } else {
        throw new Error();
      }
    } catch (error) {
      alert("Erro ao salvar alterações no servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !user || !window.confirm("Deseja mesmo apagar este livro e todos os seus capítulos? ☕")) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/stories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        navigate("/");
      } else {
        alert("Erro ao deletar a obra.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (fetching) return (
    <div className="global-loader">
      <span>☕</span>
      <p>Moendo os grãos da sua história...</p>
    </div>
  );

  return (
    <div className="detail-page fade-in">
      <div className="detail-card edit-mode">
        <header className="detail-header">
          <button className="back-btn" onClick={() => navigate(`/story/${id}`)}>← Voltar para a Obra</button>
          <div className="header-info">
            <span className="author-badge">Editando sua Obra</span>
          </div>
        </header>

        <main className="detail-main">
          <div className="input-field">
            <label>Título do Livro</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: As Crônicas de Ark"
            />
          </div>

          <div className="input-field">
            <label>URL da Capa</label>
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://link-da-imagem.com/foto.jpg"
            />
          </div>

          <div className="input-field">
            <label>Gênero</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="Geral">Geral</option>
              <option value="Fantasia">Fantasia</option>
              <option value="Romance">Romance</option>
              <option value="Suspense">Suspense</option>
              <option value="Terror">Terror</option>
            </select>
          </div>

          <div className="input-field">
            <label>Sinopse</label>
            <textarea
              className="detail-content-area"
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Conte do que se trata sua história..."
            />
          </div>
        </main>

        <footer className="detail-actions">
          <button className="delete-btn" onClick={handleDelete}>Deletar Livro</button>
          <button className="save-btn" onClick={handleUpdate} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditStory;