import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Toast } from "../utils/swal";
import { isContentAllowed } from "../services/moderation";
import "../styles/createStory.css";

const CreateStory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Conto");
  const [synopsis, setSynopsis] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);

  /* ========================= */
  /* LOAD LOCAL STORAGE */
  /* ========================= */
  useEffect(() => {
    const saved = localStorage.getItem("cookie_book_base");
    if (saved) {
      const data = JSON.parse(saved);
      setTitle(data.title || "");
      setGenre(data.genre || "Conto");
      setSynopsis(data.synopsis || "");
      setCoverUrl(data.coverUrl || "");
      setVisibility(data.visibility || "public");
    }
  }, []);

  /* ========================= */
  /* AUTO SAVE */
  /* ========================= */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || synopsis) {
        localStorage.setItem(
          "cookie_book_base",
          JSON.stringify({ title, genre, synopsis, coverUrl, visibility })
        );
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, genre, synopsis, coverUrl, visibility]);

  /* ========================= */
  /* CREATE STORY */
  /* ========================= */
  const handleCreateBook = async () => {
    if (!user) {
      Toast.fire({ icon: "error", title: "Sessão expirada." });
      return;
    }

    if (!title.trim() || !synopsis.trim()) {
      Toast.fire({ icon: "warning", title: "Título e Sinopse são obrigatórios!" });
      return;
    }

    // 🚫 MODERAÇÃO
    if (!isContentAllowed(title + " " + synopsis)) {
      Toast.fire({ icon: "error", title: "Conteúdo proibido 🚫" });
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "stories"), {
        title: title.trim(),
        synopsis: synopsis.trim(),
        genre,
        visibility,
        userId: user.uid,
        authorName: user.displayName || "Escritor",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        coverUrl:
          coverUrl ||
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",

        chapterCount: 0,
        status: "writing",

        // ❤️ sistema de likes
        likes: [],
        likesCount: 0,
      });

      // 🔥 ANTI-SPAM (ESSENCIAL)
      await updateDoc(doc(db, "users", user.uid), {
        lastPostAt: serverTimestamp(),
      });

      localStorage.removeItem("cookie_book_base");

      Toast.fire({ icon: "success", title: "Obra registrada!" });

      navigate("/profile");
    } catch (e) {
      Toast.fire({ icon: "error", title: "Erro ao criar a obra." });
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
            <button
              className="btn-primary"
              onClick={handleCreateBook}
              disabled={loading}
            >
              {loading ? "Preparando..." : "Criar Livro"}
            </button>
          </div>
        </header>

        <main className="create-main-form">
          <h1 className="form-step-title">Novo Livro na Estante</h1>

          <input
            className="main-title-input"
            placeholder="Título da Obra"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="metadata-grid">
            <div className="field">
              <label>Gênero</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                <option>Conto</option>
                <option>Fantasia</option>
                <option>Terror</option>
                <option>Sci-Fi</option>
                <option>Romance</option>
              </select>
            </div>

            <div className="field">
              <label>Privacidade</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="public">Pública</option>
                <option value="private">Privada</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Link da Capa</label>
            <input
              type="text"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="URL da imagem..."
            />
          </div>

          <div className="field">
            <label>Sinopse / Resumo</label>
            <textarea
              className="main-content-input"
              style={{ minHeight: "250px" }}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Descreva seu mundo aqui..."
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateStory;