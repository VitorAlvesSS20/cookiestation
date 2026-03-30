import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Corrigido: Importado para o botão de login
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, Timestamp, doc, getDoc 
} from "firebase/firestore";
import { Toast } from "../utils/swal";
import "../styles/comments.css";

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar: string;
  createdAt: Timestamp;
}

interface CommentsProps {
  storyId: string;
}

const Comments: React.FC<CommentsProps> = ({ storyId }) => {
  const { user } = useAuth();
  const navigate = useNavigate(); // Corrigido: Declarado o hook
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<{ photoURL?: string }>({});

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setCurrentUserData(userSnap.data());
      } catch (err) {
        console.error("Erro ao carregar dados do usuário:", err);
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (!storyId) return;

    // Acessando a subcoleção dentro de stories
    const commentsRef = collection(db, "stories", storyId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];
      
      setComments(fetchedComments);
      setLoading(false);
    }, (error) => {
      console.error("Erro Firebase (Permissões):", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storyId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      Toast.fire({ icon: 'info', title: 'Faça login para participar!' });
      return;
    }
    if (!newComment.trim()) return;

    try {
      const commentsRef = collection(db, "stories", storyId, "comments");
      const finalAvatar = currentUserData.photoURL || user.photoURL || `https://api.dicebear.com/8.x/notionists/svg?seed=${user.uid}`;

      await addDoc(commentsRef, {
        text: newComment.trim(),
        userId: user.uid,
        userName: user.displayName || "Cozinheiro Anônimo",
        userAvatar: finalAvatar,
        createdAt: serverTimestamp(),
      });

      setNewComment("");
      Toast.fire({ icon: 'success', title: 'Comentário enviado! 🍪', timer: 1500 });
    } catch (error) {
      console.error("Erro ao salvar comentário:", error);
      Toast.fire({ icon: 'error', title: 'Erro ao enviar.' });
    }
  };

  const formAvatar = currentUserData.photoURL || user?.photoURL || `https://api.dicebear.com/8.x/notionists/svg?seed=${user?.uid}`;

  return (
    <div className="comments-section fade-in">
      <h3>Conversas na Estação ({comments.length})</h3>

      {user ? (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <img 
            src={formAvatar} 
            alt="Avatar" 
            className="comment-avatar" 
            onError={(e) => (e.currentTarget.src = `https://api.dicebear.com/8.x/notionists/svg?seed=${user.uid}`)}
          />
          <div className="form-group">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um ingrediente a essa conversa..."
              rows={3}
            />
            <button type="submit" className="btn-comment" disabled={!newComment.trim()}>
              Comentar
            </button>
          </div>
        </form>
      ) : (
        <div className="login-prompt">
          <p>Quer participar? <button className="btn-link" onClick={() => navigate('/login')}>Faça login</button></p>
        </div>
      )}

      {loading ? (
        <p className="loading-comments">Carregando...</p>
      ) : comments.length === 0 ? (
        <p className="no-comments">Seja o primeiro a comentar!</p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item fade-in">
              <img 
                src={comment.userAvatar} 
                alt={comment.userName} 
                className="comment-avatar" 
                onError={(e) => (e.currentTarget.src = `https://api.dicebear.com/8.x/notionists/svg?seed=${comment.userId}`)}
              />
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.userName}</span>
                  <span className="comment-date">
                    {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : "agora"}
                  </span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comments;