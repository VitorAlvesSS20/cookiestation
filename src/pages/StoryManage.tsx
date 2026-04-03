import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { Toast, ConfirmDialog } from "../utils/swal";
import "../styles/createStory.css";

const StoryManage: React.FC = () => {
  const { storyId } = useParams();
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChapters = async () => {
      if (!storyId) return;
      try {
        const snap = await getDocs(
          collection(db, "stories", storyId, "chapters"),
        );
        // Ordenar capítulos (assumindo que você tenha um campo createdAt ou queira por título)
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setChapters(docs);
      } catch (error) {
        Toast.fire({ icon: "error", title: "Erro ao carregar capítulos." });
      } finally {
        setLoading(false);
      }
    };
    fetchChapters();
  }, [storyId]);

  const handleDeleteChapter = async (capId: string) => {
    const result = await ConfirmDialog(
      "Excluir Capítulo?",
      "Esta ação removerá o conteúdo permanentemente.",
    );

    if (!result.isConfirmed || !storyId) return;

    try {
      await deleteDoc(doc(db, "stories", storyId, "chapters", capId));
      await updateDoc(doc(db, "stories", storyId), {
        chapterCount: increment(-1),
      });
      setChapters((prev) => prev.filter((c) => c.id !== capId));
      Toast.fire({ icon: "success", title: "Capítulo removido." });
    } catch {
      Toast.fire({ icon: "error", title: "Erro ao excluir." });
    }
  };

  if (loading) return <div className="global-loader">☕</div>;

  return (
    <div className="create-page-wrapper fade-in">
      <div className="create-container-refined">
        <header className="create-actions-top">
          <button
            className="btn-exit"
            onClick={() => navigate(`/story/${storyId}`)}
          >
            ← Voltar para a Obra
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate(`/story/${storyId}/create-chapter`)}
          >
            + Novo Capítulo
          </button>
        </header>

        <main className="create-main-form">
          <header
            style={{
              marginBottom: "30mm",
              borderBottom: "1pt solid #1a120b",
              paddingBottom: "10px",
            }}
          >
            <h1
              className="print-title"
              style={{ fontSize: "28pt", textAlign: "left" }}
            >
              Gerenciar Capítulos
            </h1>
            <p
              className="print-author"
              style={{ fontSize: "10pt", marginTop: "5px", textAlign: "left" }}
            >
              {chapters.length} capítulos publicados
            </p>
          </header>

          <div className="chapters-list-premium">
            {chapters.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#8b7e74",
                  fontStyle: "italic",
                }}
              >
                Nenhum capítulo encontrado para esta obra.
              </p>
            ) : (
              chapters.map((cap, index) => (
                <div key={cap.id} className="chapter-admin-card-refined">
                  <div className="chapter-info">
                    <span className="chapter-number">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="chapter-name">{cap.title}</h3>
                  </div>

                  <div className="admin-btns-group">
                    <button
                      className="btn-edit-small"
                      onClick={() =>
                        navigate(`/story/${storyId}/edit-chapter/${cap.id}`)
                      }
                    >
                      Editar
                    </button>
                    <button
                      className="btn-delete-small"
                      onClick={() => handleDeleteChapter(cap.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StoryManage;
