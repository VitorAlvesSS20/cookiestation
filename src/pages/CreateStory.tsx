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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (title.trim() || synopsis.trim()) {
        localStorage.setItem(
          "cookie_book_base",
          JSON.stringify({ title, genre, synopsis, coverUrl, visibility })
        );
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, genre, synopsis, coverUrl, visibility]);

  const handleCreateBook = async () => {
    if (!user) {
      Toast.fire({ icon: "error", title: "Sessão expirada. Entre novamente." });
      return;
    }

    if (!title.trim() || !synopsis.trim()) {
      Toast.fire({ icon: "warning", title: "Dê um nome e uma sinopse à sua obra! 🖋️" });
      return;
    }

    if (!isContentAllowed(title + " " + synopsis)) {
      Toast.fire({ icon: "error", title: "Conteúdo não permitido pelas diretrizes." });
      return;
    }

    setLoading(true);

    try {
      const storyData = {
        title: title.trim(),
        synopsis: synopsis.trim(),
        genre,
        visibility,
        userId: user.uid,
        authorName: user.displayName || "Escritor Anônimo",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        coverUrl: coverUrl.trim() || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
        chapterCount: 0,
        status: "writing",
        likes: [],
        likesCount: 0,
      };

      await addDoc(collection(db, "stories"), storyData);

      await updateDoc(doc(db, "users", user.uid), {
        lastPostAt: serverTimestamp(),
      });

      localStorage.removeItem("cookie_book_base");

      Toast.fire({ 
        icon: "success", 
        title: "Obra registrada com sucesso! 🍪",
        text: "Sua história já está na estante."
      });

      navigate("/profile");
    } catch (e) {
      console.error(e);
      Toast.fire({ icon: "error", title: "Ops! Ocorreu um erro ao salvar." });
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
              {loading ? "Preparando Café..." : "Publicar Obra"}
            </button>
          </div>
        </header>

        <main className="create-main-form">
          <h1 className="form-step-title">Novo Livro na Estante</h1>

          <div className="field">
            <input
              className="main-title-input"
              placeholder="Título..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="metadata-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="field">
              <label className="label-url">Gênero</label>
              <select className="url-input" value={genre} onChange={(e) => setGenre(e.target.value)}>
                <option>Conto</option>
                <option>Fantasia</option>
                <option>Terror</option>
                <option>Sci-Fi</option>
                <option>Romance</option>
                <option>Aventura</option>
              </select>
            </div>

            <div className="field">
              <label className="label-url">Privacidade</label>
              <select
                className="url-input"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                <option value="public">Pública</option>
                <option value="private">Privada</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label className="label-url">Link da Capa do Livro</label>
            <input
              className="url-input"
              type="text"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="Cole a URL da imagem aqui..."
            />
            {coverUrl && (
              <div className="preview-container" style={{ maxHeight: '250px' }}>
                <img 
                  src={coverUrl} 
                  alt="Preview da Capa" 
                  className="chapter-cover-preview"
                  onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/400x600?text=Capa+Invalida")}
                />
              </div>
            )}
          </div>

          <div className="field">
            <label className="label-url">Sinopse</label>
            <textarea
              className="main-content-input"
              style={{ minHeight: "200px", fontSize: "1rem" }}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Sobre o que é o seu mundo?"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateStory;