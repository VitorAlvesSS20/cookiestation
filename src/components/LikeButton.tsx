import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Toast } from "../utils/swal";

interface LikeProps {
  storyId: string;
}

const LikeButton: React.FC<LikeProps> = ({ storyId }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const fetchLikes = async () => {
      const storyDoc = await getDoc(doc(db, "stories", storyId));
      if (storyDoc.exists()) {
        const data = storyDoc.data();
        setLikeCount(data.likesCount || 0);
        // Verifica se o UID do usuário está no array de likes
        if (user) {
          setLiked(data.likes?.includes(user.uid) || false);
        }
      }
    };
    fetchLikes();
  }, [storyId, user]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return Toast.fire({ icon: 'info', title: 'Faça login para curtir! ☕' });

    const storyRef = doc(db, "stories", storyId);

    try {
      if (!liked) {
        // Otimismo na UI
        setLiked(true);
        setLikeCount(prev => prev + 1);

        await updateDoc(storyRef, {
          likes: arrayUnion(user.uid),
          likesCount: increment(1)
        });
      } else {
        // Otimismo na UI
        setLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));

        await updateDoc(storyRef, {
          likes: arrayRemove(user.uid),
          likesCount: increment(-1)
        });
      }
    } catch (err) {
      console.error("Erro ao curtir:", err);
      // Reverte se der erro (QA fallback)
      setLiked(!liked);
    }
  };

  return (
    <button className={`btn-like ${liked ? 'active' : ''}`} onClick={toggleLike}>
      {liked ? "❤️" : "🤍"} {likeCount}
    </button>
  );
};

export default LikeButton;