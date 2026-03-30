import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { 
  collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, deleteDoc 
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Toast, ConfirmDialog } from "../utils/swal";
import "../styles/createStory.css";

const CreateChapter: React.FC = () => {
  const { storyId, chapterId } = useParams<{ storyId: string, chapterId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [chapterTitle, setChapterTitle] = useState("");
  const [content, setContent] = useState("");
  const [chapterCover, setChapterCover] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    if (!storyId) return;

    const fetchChapter = async () => {
      if (chapterId) {
        try {
          const docSnap = await getDoc(doc(db, "stories", storyId, "chapters", chapterId));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setChapterTitle(data.title || "");
            setContent(data.content || "");
            setChapterCover(data.chapterCover || "");
            setIsEditing(true);
          }
        } catch (error) {
          console.error(error);
          Toast.fire({ icon: "error", title: "Erro ao carregar capítulo." });
        }
      } else {
        const saved = localStorage.getItem(`draft_chapter_${storyId}`);
        if (saved) {
          const data = JSON.parse(saved);
          setChapterTitle(data.title || "");
          setContent(data.content || "");
          setChapterCover(data.cover || "");
        }
      }
    };

    fetchChapter();
  }, [storyId, chapterId]);

  useEffect(() => {
    if (isEditing || !storyId) return;

    const timer = setTimeout(() => {
      if (chapterTitle.trim() || content.trim()) {
        localStorage.setItem(
          `draft_chapter_${storyId}`,
          JSON.stringify({ title: chapterTitle, content, cover: chapterCover })
        );
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [chapterTitle, content, chapterCover, storyId, isEditing]);

  const handlePublish = async () => {
    if (!user || !storyId) return;
    if (!chapterTitle.trim() || !content.trim()) {
      return Toast.fire({ icon: "warning", title: "Título e texto são obrigatórios!" });
    }

    setLoading(true);
    try {
      const storyRef = doc(db, "stories", storyId);
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

      const chapterData = {
        title: chapterTitle.trim(),
        content: content.trim(),
        chapterCover: chapterCover.trim(),
        wordCount,
        updatedAt: serverTimestamp()
      };

      if (isEditing && chapterId) {
        await updateDoc(doc(db, "stories", storyId, "chapters", chapterId), chapterData);
        Toast.fire({ icon: "success", title: "Capítulo atualizado!" });
      } else {
        await addDoc(collection(storyRef, "chapters"), {
          ...chapterData,
          createdAt: serverTimestamp()
        });

        await updateDoc(storyRef, {
          chapterCount: increment(1),
          lastUpdate: serverTimestamp()
        });

        localStorage.removeItem(`draft_chapter_${storyId}`);
        Toast.fire({ icon: "success", title: "Capítulo publicado! 🍪" });
      }

      navigate(`/story/${storyId}`);
    } catch (e) {
      console.error(e);
      Toast.fire({ icon: "error", title: "Erro ao salvar capítulo." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const result = await ConfirmDialog("Excluir Capítulo?", "Esta ação é permanente.");
    if (!result.isConfirmed || !storyId || !chapterId) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "stories", storyId, "chapters", chapterId));
      await updateDoc(doc(db, "stories", storyId), {
        chapterCount: increment(-1)
      });
      Toast.fire({ icon: "success", title: "Capítulo removido." });
      navigate(`/story/${storyId}`);
    } catch {
      Toast.fire({ icon: "error", title: "Erro ao excluir." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page-wrapper fade-in">
      <div className="create-container-refined">
        <header className="create-actions-top">
          <button className="btn-exit" onClick={() => navigate(-1)}>
            ← Cancelar
          </button>

          <div className="group-btns">
            {isEditing && (
              <button className="btn-delete" onClick={handleDelete} disabled={loading}>
                Excluir
              </button>
            )}

            <button className="btn-primary" onClick={handlePublish} disabled={loading}>
              {loading ? "Processando..." : isEditing ? "Salvar Alterações" : "Publicar Capítulo"}
            </button>
          </div>
        </header>

        <main className="create-main-form">
          <h1 className="form-step-title">
            {isEditing ? "Editar Capítulo" : "Escrever Capítulo"}
          </h1>

          <div className="field">
            <input
              className="main-title-input"
              placeholder="Dê um nome ao seu capítulo..."
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label-url">Link da Imagem de Capa</label>
            <input 
              className="url-input"
              type="text" 
              placeholder="Cole a URL da imagem aqui (Pinterest, Imgur...)"
              value={chapterCover}
              onChange={(e) => setChapterCover(e.target.value)}
            />

            {chapterCover && (
              <div className="preview-container">
                <img 
                  src={chapterCover} 
                  alt="Preview" 
                  className="chapter-cover-preview" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Imagem+Invalida";
                  }}
                />
                <button 
                  className="btn-remove-img" 
                  onClick={() => setChapterCover("")}
                >
                  Remover Link
                </button>
              </div>
            )}
          </div>

          <div className="field">
            <textarea
              ref={textareaRef}
              className="main-content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Era uma vez..."
              style={{ overflow: 'hidden' }}
            />
            <div className="word-count-badge">
              {content.trim().split(/\s+/).filter(Boolean).length} palavras
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateChapter;