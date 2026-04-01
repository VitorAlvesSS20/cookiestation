import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { deleteUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Toast, ConfirmDialog } from "../utils/swal";
import "../styles/profile.css";

const API_URL = import.meta.env.VITE_API_URL;

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
      const token = await user.getIdToken();

      const userRes = await fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (userRes.ok) {
        const data = await userRes.json();
        setDisplayName(data.displayName || "");
        setBio(data.bio || "");
        setPhotoURL(data.photoURL || "");
        setLocation(data.location || "");
        setAuthorStatus(data.authorStatus || "");
        setWriterXP(data.writerXP || 0);
      }

      const booksRes = await fetch(`${API_URL}/stories/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setMyBooks(booksData);
      }
      
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
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          displayName, 
          bio, 
          photoURL, 
          location, 
          authorStatus 
        })
      });

      if (response.ok) {
        setIsEditing(false);
        Toast.fire({ icon: 'success', title: 'Perfil atualizado! ✍️' });
      } else {
        throw new Error();
      }
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Erro ao salvar alterações.' });
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    const result = await ConfirmDialog("Apagar Obra?", "Isso excluirá todos os capítulos permanentemente.");
    if (!result.isConfirmed || !user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/stories/${bookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMyBooks(prev => prev.filter(b => b.id !== bookId));
        Toast.fire({ icon: 'success', title: 'Obra removida.' });
      }
    } catch (e) {
      Toast.fire({ icon: 'error', title: 'Erro ao deletar obra.' });
    }
  };

  const handleDeleteAccount = async () => {
    const result = await ConfirmDialog("Ação Irreversível!", "Excluir sua conta apagará todas as suas histórias e perfil permanentemente.");
    if (!result.isConfirmed || !user) return;

    try {
      const token = await user.getIdToken();
      const userId = user.uid;
      
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Erro ao limpar dados no servidor.");

      await deleteUser(user);
      navigate("/register");

    } catch (e: any) { 
      if (e.code === 'auth/requires-recent-login') {
        Toast.fire({ icon: 'warning', title: 'Sessão expirada. Saia e entre novamente para confirmar a exclusão.' });
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
            style={{ backgroundImage: `url(${photoURL || 'https://ui-avatars.com/api/?name=' + (displayName || 'User')})` }} 
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