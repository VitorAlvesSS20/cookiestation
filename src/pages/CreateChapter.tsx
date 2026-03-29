import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "../services/firebase";
import { 
  collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, deleteDoc 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthContext";
import { Toast, ConfirmDialog } from "../utils/swal";
import "../styles/createStory.css";

const CreateChapter: React.FC = () => {
  const { storyId, chapterId } = useParams<{ storyId: string, chapterId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [chapterTitle, setChapterTitle] = useState("");
  const [content, setContent] = useState("");
  const [chapterCover, setChapterCover] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (chapterId && storyId) {
      const fetchChapter = async () => {
        const docSnap = await getDoc(doc(db, "stories", storyId, "chapters", chapterId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setChapterTitle(data.title || "");
          setContent(data.content || "");
          setChapterCover(data.chapterCover || "");
          setIsEditing(true);
        }
      };
      fetchChapter();
    } else {
      const saved = localStorage.getItem(`draft_chapter_${storyId}`);
      if (saved) {
        const data = JSON.parse(saved);
        setChapterTitle(data.title || "");
        setContent(data.content || "");
        setChapterCover(data.cover || "");
      }
    }
  }, [storyId, chapterId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isEditing && (chapterTitle || content)) {
        localStorage.setItem(
          `draft_chapter_${storyId}`,
          JSON.stringify({
            title: chapterTitle,
            content,
            cover: chapterCover
          })
        );
      }
    }, 1500);
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
      const wordCount = content.trim().split(/\s+/).length;

      let imageUrl = chapterCover;

      // 🔥 Upload real
      if (selectedFile) {
        const fileRef = ref(
          storage,
          `chapters/${storyId}/${Date.now()}_${selectedFile.name}`
        );

        await uploadBytes(fileRef, selectedFile);
        imageUrl = await getDownloadURL(fileRef);
      }

      if (isEditing && chapterId) {
        await updateDoc(doc(db, "stories", storyId, "chapters", chapterId), {
          title: chapterTitle.trim(),
          content: content.trim(),
          chapterCover: imageUrl || "",
          wordCount
        });

        Toast.fire({ icon: "success", title: "Capítulo atualizado!" });
      } else {
        await addDoc(collection(storyRef, "chapters"), {
          title: chapterTitle.trim(),
          content: content.trim(),
          chapterCover: imageUrl || "",
          createdAt: serverTimestamp(),
          wordCount
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
    const result = await ConfirmDialog(
      "Excluir Capítulo?",
      "Esta ação não pode ser desfeita."
    );

    if (result.isConfirmed && storyId && chapterId) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "stories", storyId, "chapters", chapterId));

        await updateDoc(doc(db, "stories", storyId), {
          chapterCount: increment(-1)
        });

        Toast.fire({ icon: "success", title: "Capítulo removido." });
        navigate(`/story/${storyId}`);
      } catch {
        Toast.fire({ icon: "error", title: "Erro ao excluir capítulo." });
      } finally {
        setLoading(false);
      }
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
            {isEditing && (
              <button
                className="btn-delete"
                onClick={handleDelete}
                disabled={loading}
              >
                Excluir
              </button>
            )}

            <button
              className="btn-primary"
              onClick={handlePublish}
              disabled={loading}
            >
              {loading
                ? "Gravando..."
                : isEditing
                ? "Salvar Alterações"
                : "Publicar Capítulo"}
            </button>
          </div>
        </header>

        <main className="create-main-form">
          <h1 className="form-step-title">
            {isEditing ? "Editando Capítulo 🖋️" : "Novo Capítulo"}
          </h1>

          <input
            className="main-title-input"
            placeholder="Título do Capítulo"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
          />

          {/* 🔥 UPLOAD + PREVIEW */}
          <div className="field">
            <label>Capa do Capítulo</label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  setChapterCover(URL.createObjectURL(file));
                }
              }}
            />

            {chapterCover && (
              <img
                src={chapterCover}
                alt="Preview"
                style={{
                  marginTop: "10px",
                  width: "100%",
                  borderRadius: "12px"
                }}
              />
            )}
          </div>

          <div className="field">
            <label>Conteúdo</label>
            <textarea
              className="main-content-input"
              style={{ minHeight: "450px" }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva sua história..."
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateChapter;