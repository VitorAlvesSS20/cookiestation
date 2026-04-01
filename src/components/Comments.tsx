import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Toast } from "../utils/swal";
import api from "../services/api";
import "../styles/comments.css";

interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userPhoto: string;
  createdAt: any;
}

interface CommentsProps {
  storyId: string;
}

const Comments: React.FC<CommentsProps> = ({ storyId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    if (!storyId) return;
    try {
      const response = await api.get(`/comments/${storyId}`);
      setComments(response.data);
    } catch (err) {
      console.error("Erro ao carregar comentários:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [storyId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      Toast.fire({ icon: 'info', title: 'Faça login para participar!' });
      return;
    }
    if (!newComment.trim()) return;

    try {
      await api.post(`/comments/${storyId}`, {
        content: newComment.trim(),
        storyId: storyId
      });

      setNewComment("");
      fetchComments();
      Toast.fire({ icon: 'success', title: 'Comentário enviado! 🍪', timer: 1500 });
    } catch (error) {
      console.error("Erro ao salvar comentário:", error);
      Toast.fire({ icon: 'error', title: 'Erro ao enviar.' });
    }
  };

  const formAvatar = user?.photoURL || `https://api.dicebear.com/8.x/notionists/svg?seed=${user?.uid}`;

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
                src={comment.userPhoto || `https://api.dicebear.com/8.x/notionists/svg?seed=${comment.userId}`} 
                alt={comment.userName} 
                className="comment-avatar" 
                onError={(e) => (e.currentTarget.src = `https://api.dicebear.com/8.x/notionists/svg?seed=${comment.userId}`)}
              />
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.userName}</span>
                  <span className="comment-date">
                    {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : "agora"}
                  </span>
                </div>
                <p className="comment-text">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comments;