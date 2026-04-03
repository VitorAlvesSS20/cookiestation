import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Toast } from "../utils/swal";
import { isContentAllowed } from "../services/moderation";
import "../styles/createStory.css";

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

const CreateStory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [genres, setGenres] = useState<string[]>(["Conto"]);
  const [synopsis, setSynopsis] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [status, setStatus] = useState("Em andamento");
  const [rating, setRating] = useState("Livre");
  const [tags, setTags] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("cookie_book_base");
    if (saved) {
      const data = JSON.parse(saved);
      setTitle(data.title ?? "");
      setGenres(data.genres ?? ["Conto"]);
      setSynopsis(data.synopsis ?? "");
      setCoverUrl(data.coverUrl ?? "");
      setVisibility(data.visibility ?? "public");
      setStatus(data.status ?? "Em andamento");
      setRating(data.rating ?? "Livre");
      setTags(data.tags ?? "");
      setIsDraft(data.isDraft ?? false);
    }
  }, []);

  useEffect(() => {
    setAutoSaveStatus("Salvando...");
    const timer = setTimeout(() => {
      localStorage.setItem(
        "cookie_book_base",
        JSON.stringify({
          title,
          genres,
          synopsis,
          coverUrl,
          visibility,
          status,
          rating,
          tags,
          isDraft,
        }),
      );
      setAutoSaveStatus("Salvo automaticamente");
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    title,
    genres,
    synopsis,
    coverUrl,
    visibility,
    status,
    rating,
    tags,
    isDraft,
  ]);

  const toggleGenre = (g: string) => {
    if (genres.includes(g)) {
      const updated = genres.filter((item) => item !== g);
      setGenres(updated.length > 0 ? updated : ["Conto"]);
    } else {
      if (genres.length >= 5) return;
      setGenres([...genres, g]);
    }
  };

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

  const handleCreateBook = async () => {
    if (!user) {
      Toast.fire({ icon: "error", title: "Sessão expirada." });
      return;
    }

    if (title.trim().length < 3 || title.length > 80) {
      Toast.fire({ icon: "warning", title: "Título inválido." });
      return;
    }

    if (synopsis.trim().length < 20 || synopsis.length > 500) {
      Toast.fire({ icon: "warning", title: "Sinopse inválida." });
      return;
    }

    if (!isContentAllowed(title + synopsis)) {
      Toast.fire({ icon: "error", title: "Conteúdo não permitido." });
      return;
    }

    setLoading(true);

    try {
      const slug = generateSlug(title);
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const storyData = {
        title: title.trim(),
        synopsis: synopsis.trim(),
        genres,
        tags: tagsArray,
        rating,
        status,
        visibility,
        isDraft,
        slug,
        searchKeywords: [...tagsArray, ...genres, title.toLowerCase()],
        userId: user.uid,
        authorName: user.displayName ?? "Escritor Anônimo",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        coverUrl:
          coverUrl.trim() ||
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
        chapterCount: 0,
        likes: [],
        likesCount: 0,
        views: 0,
      };

      await addDoc(collection(db, "stories"), storyData);

      await updateDoc(doc(db, "users", user.uid), {
        lastPostAt: serverTimestamp(),
      });

      localStorage.removeItem("cookie_book_base");

      Toast.fire({
        icon: "success",
        title: isDraft ? "Rascunho salvo!" : "Obra publicada!",
      });

      navigate("/profile");
    } catch {
      Toast.fire({ icon: "error", title: "Erro ao salvar." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page-wrapper fade-in">
      <div className="create-container-refined">
        <header className="create-actions-top">
          <button className="btn-exit" onClick={() => navigate(-1)}>
            ← Voltar
          </button>

          <div className="group-btns">
            <span className="autosave-text">{autoSaveStatus}</span>
            <button
              className="btn-secondary"
              onClick={() => {
                setIsDraft(true);
                handleCreateBook();
              }}
              disabled={loading}
            >
              Rascunho
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setIsDraft(false);
                handleCreateBook();
              }}
              disabled={loading}
            >
              Publicar
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsDraft(true);
                window.print();
              }}
              disabled={!title}
            >
              <span></span> Imprimir Planejamento
            </button>
          </div>
        </header>

        <main className="create-main-form">
          <input
            className="main-title-input"
            placeholder="Título da sua história..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

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
          <div className="genre-limit">
            Gêneros selecionados: {genres.length}/5
          </div>

          <div className="metadata-grid">
            <div className="input-group">
              <label className="label-url">Status</label>
              <select
                className="url-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Em andamento</option>
                <option>Concluída</option>
                <option>Hiato</option>
              </select>
            </div>

            <div className="input-group">
              <label className="label-url">Classificação</label>
              <select
                className="url-input"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                <option>Livre</option>
                <option>10+</option>
                <option>12+</option>
                <option>14+</option>
                <option>16+</option>
                <option>18+</option>
              </select>
            </div>
          </div>

          <label className="label-url">Tags e Identidade</label>
          <input
            className="url-input"
            placeholder="Tags (ação, romance, etc) separadas por vírgula"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <input
            className="url-input"
            placeholder="Link da imagem de capa (URL)"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />

          {coverUrl && (
            <div className="preview-container">
              <img
                src={coverUrl}
                alt="preview"
                className="chapter-cover-preview"
              />
              <button
                className="btn-remove-img"
                onClick={() => setCoverUrl("")}
              >
                Remover Capa
              </button>
            </div>
          )}

          <textarea
            className="main-content-input"
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="Escreva uma sinopse cativante..."
          />
        </main>
      </div>

      <div className="print-only-section">
        <div className="print-cover">
          {coverUrl && <img src={coverUrl} className="print-img" alt="Capa" />}
          <h1 className="print-title">{title || "Título Provisório"}</h1>
          <p className="print-author">{user?.displayName || "Autor"}</p>
        </div>

        <div className="print-content">
          <div className="print-header-meta">
            <div data-label="Gêneros Literários">
              <span>{genres.join(" / ")}</span>
            </div>
            <div data-label="Classificação">
              <span>{rating}</span>
            </div>
            <div data-label="Status da Obra">
              <span>{status}</span>
            </div>
          </div>

          <div className="print-synopsis">
            <h2>Sinopse da Obra</h2>
            <p>
              {synopsis || "O autor ainda não definiu a sinopse deste projeto."}
            </p>
          </div>

          <div className="print-footer-info">
            <span>Tags: {tags || "Nenhuma"}</span>
            <span>Documento gerado em {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStory;
