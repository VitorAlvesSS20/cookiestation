import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Toast } from "../utils/swal";
import api from "../services/api";

interface LikeProps {
  storyId: string;
}

const LikeButton: React.FC<LikeProps> = ({ storyId }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const fetchLikes = async () => {
      if (!storyId) return;
      try {
        const response = await api.get(`/stories/${storyId}`);
        const data = response.data;
        
        setLikeCount(data.likesCount || 0);
        
        if (user) {
          setLiked(data.isLiked || false);
        }
      } catch (err) {
        console.error("Erro ao buscar likes:", err);
      }
    };
    fetchLikes();
  }, [storyId, user]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      return Toast.fire({ 
        icon: 'info', 
        title: 'Faça login para curtir! ☕' 
      });
    }

    const previousLiked = liked;
    const previousCount = likeCount;

    try {
      setLiked(!liked);
      setLikeCount(prev => liked ? Math.max(0, prev - 1) : prev + 1);

      await api.post(`/stories/${storyId}/like`, {});
      
    } catch (err) {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      
      console.error("Erro no toggleLike:", err);
      Toast.fire({ 
        icon: 'error', 
        title: 'Erro ao processar curtida.' 
      });
    }
  };

  return (
    <button 
      className={`btn-like ${liked ? 'active' : ''}`} 
      onClick={toggleLike}
      type="button"
    >
      <span className="like-icon">{liked ? "❤️" : "🤍"}</span>
      <span className="like-count">{likeCount}</span>
    </button>
  );
};

export default LikeButton;