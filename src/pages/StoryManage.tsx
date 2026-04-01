import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Toast } from "../utils/swal";
import "../styles/createStory.css";

const StoryManage: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const { user } = useAuth();
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChapters = async () => {
      if (!storyId || !user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch(`http://localhost:8000/stories/${storyId}/chapters/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setChapters(data);
        }
      } catch (error) {
        console.error("Erro ao carregar capítulos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChapters();
  }, [storyId, user]);

  const handleDeleteChapter = async (capId: string) => {
    if (!storyId || !user || !window.confirm("Deseja mesmo deletar este capítulo? ☕")) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:8000/stories/${storyId}/chapters/${capId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setChapters(prev => prev.filter(c => c.id !== capId));
        Toast.fire({ icon: "success", title: "Capítulo removido com sucesso." });
      } else {
        throw new Error();
      }
    } catch (error) {
      Toast.fire({ icon: "error", title: "Erro ao excluir capítulo do servidor." });
    }
  };

  return (
    <div className="manage-container fade-in">
      <header className="manage-header">
        <button className="btn-exit" onClick={() => navigate("/profile")}>
          ← Voltar ao Perfil
        </button>
        <h1>Gerenciar Capítulos</h1>
      </header>

      <div className="chapters-list">
        {loading ? (
          <div className="loader-msg">☕ Moendo os dados...</div>
        ) : chapters.length > 0 ? (
          chapters.map(cap => (
            <div key={cap.id} className="chapter-admin-card">
              <div className="chapter-admin-info">
                <span className="chapter-admin-title">{cap.title}</span>
                <span className="chapter-admin-meta">{cap.wordCount || 0} palavras</span>
              </div>
              
              <div className="admin-btns">
                <button 
                  className="btn-edit-small" 
                  onClick={() => navigate(`/story/${storyId}/edit-chapter/${cap.id}`)}
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
        ) : (
          <div className="empty-state">
            <p>Nenhum capítulo encontrado para esta obra.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryManage;