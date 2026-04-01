import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../styles/storyDetail.css";

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

const EditStory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [genres, setGenres] = useState<string[]>(["Conto"]);
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
          setGenres(
            Array.isArray(data.genres)
              ? data.genres
              : data.genre
                ? [data.genre]
                : ["Conto"],
          );
        }
      } catch {
      } finally {
        setFetching(false);
      }
    };
    fetchStory();
  }, [id, user, navigate]);

  const toggleGenre = (g: string) => {
    if (genres.includes(g)) {
      const updated = genres.filter((item) => item !== g);
      setGenres(updated.length > 0 ? updated : ["Conto"]);
    } else {
      if (genres.length >= 5) return;
      setGenres([...genres, g]);
    }
  };

  const handleUpdate = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const docRef = doc(db, "stories", id);
      await updateDoc(docRef, {
        title,
        synopsis,
        coverUrl,
        genres,
        updatedAt: new Date(),
      });
      navigate(`/story/${id}`);
    } catch {
      alert("Erro ao salvar alterações.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !id ||
      !window.confirm(
        "Deseja mesmo apagar este livro e todos os seus capítulos? ☕",
      )
    )
      return;
    try {
      await deleteDoc(doc(db, "stories", id));
      navigate("/");
    } catch {}
  };

  if (fetching)
    return (
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
            <div className="genre-select-container">
              {GENRES.map((g) => {
                const isActive = genres.includes(g);
                const isLimitReached = genres.length >= 5 && !isActive;

                return (
                  <div
                    key={g}
                    className={`genre-chip ${isActive ? "active" : ""} ${
                      isLimitReached ? "disabled" : ""
                    }`}
                    onClick={() => {
                      if (!isLimitReached) toggleGenre(g);
                    }}
                  >
                    {g}
                  </div>
                );
              })}
            </div>

            <div className="genre-limit">{genres.length}/5 selecionados</div>
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
          <button
            className="save-btn"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditStory;
