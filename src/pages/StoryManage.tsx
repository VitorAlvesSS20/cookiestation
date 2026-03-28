import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc, increment } from "firebase/firestore";
import "../styles/createStory.css";

const StoryManage: React.FC = () => {
  const { storyId } = useParams();
  const [chapters, setChapters] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChapters = async () => {
      if (!storyId) return;
      const snap = await getDocs(collection(db, "stories", storyId, "chapters"));
      setChapters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchChapters();
  }, [storyId]);

  const handleDeleteChapter = async (capId: string) => {
    if (!window.confirm("Deletar este capítulo?")) return;
    await deleteDoc(doc(db, "stories", storyId!, "chapters", capId));
    await updateDoc(doc(db, "stories", storyId!), { chapterCount: increment(-1) });
    setChapters(prev => prev.filter(c => c.id !== capId));
  };

  return (
    <div className="manage-container">
      <button onClick={() => navigate("/profile")}>← Voltar ao Perfil</button>
      <h1>Gerenciar Capítulos</h1>
      <div className="chapters-list">
        {chapters.map(cap => (
          <div key={cap.id} className="chapter-admin-card">
            <span>{cap.title}</span>
            <div className="admin-btns">
              <button onClick={() => navigate(`/story/${storyId}/edit-chapter/${cap.id}`)}>Editar</button>
              <button className="delete-text" onClick={() => handleDeleteChapter(cap.id)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryManage;