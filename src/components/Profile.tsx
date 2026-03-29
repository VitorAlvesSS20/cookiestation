import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { 
  doc, getDoc, setDoc, collection, query, 
  where, getDocs, writeBatch 
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Toast, ConfirmDialog } from "../utils/swal";
import "../styles/profile.css";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [location, setLocation] = useState("");
  const [authorStatus, setAuthorStatus] = useState("");
  const [writerXP, setWriterXP] = useState(0);
  const [myBooks, setMyBooks] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      // 1. Carregar dados do usuário
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        setDisplayName(data.displayName || "");
        setBio(data.bio || "");
        setPhotoURL(data.photoURL || "");
        setLocation(data.location || "");
        setAuthorStatus(data.authorStatus || "");
        setWriterXP(data.writerXP || 0);
      } else {
        // Fallback para novos usuários
        setDisplayName(user.displayName || "Escritor");
        setPhotoURL(user.photoURL || "");
      }

      // 2. Carregar obras do usuário (Respeitando a regra de userId)
      const q = query(collection(db, "stories"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      setMyBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      
    } catch (e) {
      console.error("Erro ao carregar perfil:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { 
        displayName, 
        bio, 
        photoURL, 
        location, 
        authorStatus, 
        updatedAt: new Date() 
      }, { merge: true });

      setIsEditing(false);
      Toast.fire({ icon: 'success', title: 'Perfil atualizado! ✍️' });
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Erro ao salvar alterações.' });
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    const result = await ConfirmDialog("Apagar Obra?", "Isso excluirá todos os capítulos permanentemente.");
    if (!result.isConfirmed) return;

    try {
      const batch = writeBatch(db);
      const capsSnap = await getDocs(collection(db, "stories", bookId, "chapters"));
      capsSnap.forEach((cap) => batch.delete(cap.ref));
      batch.delete(doc(db, "stories", bookId));
      
      await batch.commit();
      setMyBooks(prev => prev.filter(b => b.id !== bookId));
      Toast.fire({ icon: 'success', title: 'Obra removida.' });
    } catch (e) {
      Toast.fire({ icon: 'error', title: 'Erro ao deletar obra.' });
    }
  };

  const handleDeleteAccount = async () => {
    const result = await ConfirmDialog("Ação Irreversível!", "Excluir sua conta apagará todas as suas histórias.");
    if (!result.isConfirmed || !user) return;

    try {
      const batch = writeBatch(db);
      // Deletar obras
      for (const book of myBooks) {
        const caps = await getDocs(collection(db, "stories", book.id, "chapters"));
        caps.forEach(c => batch.delete(c.ref));
        batch.delete(doc(db, "stories", book.id));
      }
      batch.delete(doc(db, "users", user.uid));
      
      await batch.commit();
      await deleteUser(user);
      navigate("/register");
    } catch (e: any) { 
      if (e.code === 'auth/requires-recent-login') {
        Toast.fire({ icon: 'warning', title: 'Saia e entre novamente para confirmar a exclusão.' });
      } else {
        Toast.fire({ icon: 'error', title: 'Erro ao excluir conta.' });
      }
    }
  };

  if (loading) return <div className="loader">☕ Sincronizando estante...</div>;

  return (
    <div className="profile-container fade-in">
      <header className="profile-card-header">
        <div className="profile-main-info">
          <div 
            className="avatar-wrapper" 
            style={{ backgroundImage: `url(${photoURL || 'https://ui-avatars.com/api/?name=' + displayName})` }} 
          />
          
          {isEditing ? (
            <div className="edit-form-classic">
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nome de Autor" />
              <input value={photoURL} onChange={e => setPhotoURL(e.target.value)} placeholder="URL da foto" />
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Localização" />
              <input value={authorStatus} onChange={e => setAuthorStatus(e.target.value)} placeholder="Status Atual" />
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Sua bio..." />
              <div className="edit-btns">
                <button onClick={handleUpdateProfile} className="btn-save">Salvar</button>
                <button onClick={() => setIsEditing(false)} className="btn-cancel">Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="info-display">
              <div className="title-row">
                 <h1>{displayName || "Escritor"}</h1>
                 <span className="xp-badge">⭐ {writerXP} XP</span>
              </div>
              {authorStatus && <p className="status-bubble">{authorStatus}</p>}
              <p className="bio-text">{bio || "Uma página em branco..."}</p>
              <button onClick={() => setIsEditing(true)} className="btn-edit-text">Editar Perfil</button>
            </div>
          )}
        </div>
      </header>

      <div className="profile-header-actions">
        <h2>Minhas Obras ({myBooks.length})</h2>
        <button className="btn-new-book" onClick={() => navigate("/create")}>+ Novo Livro</button>
      </div>

      <div className="books-grid">
        {myBooks.map(book => (
          <div key={book.id} className="book-card-item">
            <div className="book-visual" style={{ backgroundImage: `url(${book.coverUrl || ''})` }}>
              <div className="book-badge">{book.genre}</div>
            </div>
            <div className="book-details">
              <h3>{book.title}</h3>
              <div className="book-actions">
                <button className="btn-view" onClick={() => navigate(`/story/${book.id}`)}>Ver</button>
                <button className="btn-delete-book" onClick={() => handleDeleteBook(book.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="danger-zone-footer">
        <button className="btn-danger-text" onClick={handleDeleteAccount}>Excluir conta permanentemente</button>
      </footer>
    </div>
  );
};

export default Profile;