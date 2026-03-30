import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../styles/storyDetail.css";

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
  const [, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "stories", id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();
          if (user?.uid !== data.userId) {
            navigate("/");
            return;
          }
          setIsOwner(true);
          setTitle(data.title || "");
          setSynopsis(data.synopsis || data.sinopse || "");
          setCoverUrl(data.coverUrl || "");
          setGenre(data.genre || "Geral");
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
    if (!id) return;
    setLoading(true);
    try {
      const docRef = doc(db, "stories", id);
      await updateDoc(docRef, {
        title,
        synopsis,
        coverUrl,
        genre,
        updatedAt: new Date()
      });
      navigate(`/story/${id}`);
    } catch (error) {
      alert("Erro ao salvar alterações.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Deseja mesmo apagar este livro e todos os seus capítulos? ☕")) return;
    try {
      await deleteDoc(doc(db, "stories", id));
      navigate("/");
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
          <button className="back-btn" onClick={() => navigate(`/story/${id}`)}>
            ← Voltar para a Obra
          </button>
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
          <button className="delete-btn" onClick={handleDelete}>
            Deletar Livro
          </button>
          <button className="save-btn" onClick={handleUpdate} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditStory;