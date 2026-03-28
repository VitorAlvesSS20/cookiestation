import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { doc, runTransaction, getDoc, setDoc, deleteDoc } from "firebase/firestore";
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
    if (!user) return;
    
    const checkLike = async () => {
      const likeDoc = await getDoc(doc(db, "stories", storyId, "likes", user.uid));
      setLiked(likeDoc.exists());
      
      const storyDoc = await getDoc(doc(db, "stories", storyId));
      setLikeCount(storyDoc.data()?.likes || 0);
    };

    checkLike();
  }, [storyId, user]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede de abrir a história ao clicar no like na Home
    if (!user) return Toast.fire({ icon: 'info', title: 'Faça login para curtir! ☕' });

    const likeRef = doc(db, "stories", storyId, "likes", user.uid);
    const storyRef = doc(db, "stories", storyId);

    try {
      await runTransaction(db, async (transaction) => {
        const storySnap = await transaction.get(storyRef);
        const currentLikes = storySnap.data()?.likes || 0;

        if (!liked) {
          transaction.set(likeRef, { createdAt: new Date() });
          transaction.update(storyRef, { likes: currentLikes + 1 });
          setLikeCount(currentLikes + 1);
        } else {
          transaction.delete(likeRef);
          transaction.update(storyRef, { likes: Math.max(0, currentLikes - 1) });
          setLikeCount(Math.max(0, currentLikes - 1));
        }
        setLiked(!liked);
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button className={`btn-like ${liked ? 'active' : ''}`} onClick={toggleLike}>
      {liked ? "❤️" : "🤍"} {likeCount}
    </button>
  );
};

export default LikeButton;