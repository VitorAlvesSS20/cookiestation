import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storyId) return;

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
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storyId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      Toast.fire({ icon: 'info', title: 'Faça login para participar da conversa!' });
      return;
    }

    if (!newComment.trim()) return;

    try {
      const commentsRef = collection(db, "stories", storyId, "comments");
      
      const commentData = {
        text: newComment,
        userId: user.uid,
        userName: user.displayName || "Cozinheiro Anônimo",
        userAvatar: user.photoURL || `https://api.dicebear.com/8.x/notionists/svg?seed=${user.uid}`,
        createdAt: serverTimestamp(),
      };

      await addDoc(commentsRef, commentData);
      setNewComment("");
      
      Toast.fire({
        icon: 'success',
        title: 'Comentário servido! 🍪',
        timer: 2000
      });
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Erro ao servir seu comentário.' });
    }
  };

  return (
    <div className="comments-section">
      <h3>Conversas na Estação ({comments.length})</h3>

      {user ? (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <img src={user.photoURL || `https://api.dicebear.com/8.x/notionists/svg?seed=${user.uid}`} alt="Avatar" className="comment-avatar" />
          <div className="form-group">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um ingrediente a essa conversa..."
              rows={3}
            />
            <button type="submit" className="btn-comment" disabled={!newComment.trim()}>
              Servir Comentário 🍪
            </button>
          </div>
        </form>
      ) : (
        <div className="login-prompt">
          <p>Quer participar? <button onClick={() => window.location.href='/login'}>Faça login</button> para comentar.</p>
        </div>
      )}

      {loading ? (
        <p className="loading-comments">Preparando a mesa...</p>
      ) : comments.length === 0 ? (
        <p className="no-comments">Ninguém serviu um comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item fade-in">
              <img src={comment.userAvatar} alt={comment.userName} className="comment-avatar" />
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">{comment.userName}</span>
                  <span className="comment-date">
                    {comment.createdAt?.toDate().toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) || "agora mesmo"}
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