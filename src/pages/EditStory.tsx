import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
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

const EditStory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [genres, setGenres] = useState<string[]>(["Conto"]);
  const [status, setStatus] = useState("Em andamento");
  const [rating, setRating] = useState("Livre");
  const [tags, setTags] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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
          setTitle(data.title || "");
          setSynopsis(data.synopsis || "");
          setCoverUrl(data.coverUrl || "");
          setStatus(data.status || "Em andamento");
          setRating(data.rating || "Livre");
          setIsDraft(data.isDraft || false);
          setTags(Array.isArray(data.tags) ? data.tags.join(", ") : "");
          setGenres(Array.isArray(data.genres) ? data.genres : ["Conto"]);
        }
      } catch {
        Toast.fire({ icon: "error", title: "Erro ao carregar obra." });
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
    if (!id || !user) return;

    if (title.trim().length < 3) {
      Toast.fire({ icon: "warning", title: "Título muito curto." });
      return;
    }

    if (!isContentAllowed(title + synopsis)) {
      Toast.fire({ icon: "error", title: "Conteúdo impróprio detectado." });
      return;
    }

    setLoading(true);
    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const docRef = doc(db, "stories", id);
      await updateDoc(docRef, {
        title: title.trim(),
        synopsis: synopsis.trim(),
        coverUrl: coverUrl.trim(),
        genres,
        status,
        rating,
        tags: tagsArray,
        isDraft,
        updatedAt: serverTimestamp(),
        searchKeywords: [...tagsArray, ...genres, title.toLowerCase()],
      });

      Toast.fire({ icon: "success", title: "Alterações salvas!" });
      navigate(`/story/${id}`);
    } catch {
      Toast.fire({ icon: "error", title: "Erro ao atualizar." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !id ||
      !window.confirm(
        "Tem certeza que deseja excluir esta obra permanentemente?",
      )
    )
      return;
    try {
      await deleteDoc(doc(db, "stories", id));
      Toast.fire({ icon: "success", title: "Obra excluída." });
      navigate("/profile");
    } catch {
      Toast.fire({ icon: "error", title: "Erro ao excluir." });
    }
  };

  if (fetching)
    return (
      <div className="create-page-wrapper">
        <div className="global-loader">☕</div>
      </div>
    );

  return (
    <div className="create-page-wrapper fade-in">
      <div className="create-container-refined">
        <header className="create-actions-top">
          <button className="btn-exit" onClick={() => navigate(-1)}>
            ← Cancelar
          </button>
          <div className="group-btns">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => window.print()}
              disabled={!title}
            >
              <span></span> Imprimir planejamento
            </button>
            <button className="btn-delete-simple" onClick={handleDelete}>
              Excluir
            </button>
            <button
              className="btn-primary"
              onClick={handleUpdate}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </header>

        <main className="create-main-form">
          <div className="input-group">
            <label className="label-url">Título da Obra</label>
            <input
              className="main-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
            />
          </div>

          <div className="input-group">
            <label className="label-url">Gêneros (Até 5)</label>
            <div className="genre-select-container">
              {GENRES.map((g) => {
                const isActive = genres.includes(g);
                const isLimitReached = genres.length >= 5 && !isActive;
                return (
                  <div
                    key={g}
                    className={`genre-chip ${isActive ? "active" : ""} ${isLimitReached ? "disabled" : ""}`}
                    onClick={() => !isLimitReached && toggleGenre(g)}
                  >
                    {g}
                  </div>
                );
              })}
            </div>
            <div className="genre-limit">Selecionados: {genres.length}/5</div>
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

          <div className="input-group">
            <label className="label-url">Tags e Identidade</label>
            <input
              className="url-input"
              placeholder="Tags separadas por vírgula"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="label-url">URL da Capa</label>
            <input
              className="url-input"
              placeholder="Link da imagem (URL)"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
            />
          </div>

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

          <div className="input-group">
            <label className="label-url">Sinopse</label>
            <textarea
              className="main-content-input"
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Escreva uma sinopse cativante..."
            />
          </div>

          <div
            className="input-group"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <input
              type="checkbox"
              id="draftCheck"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
              style={{ width: "20px", height: "20px", cursor: "pointer" }}
            />
            <label
              htmlFor="draftCheck"
              style={{ cursor: "pointer", fontWeight: 700, color: "#8b7e74" }}
            >
              Manter como Rascunho (Privado)
            </label>
          </div>
        </main>
      </div>

      {/* SEÇÃO DE IMPRESSÃO PREMIUM */}
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

export default EditStory;
