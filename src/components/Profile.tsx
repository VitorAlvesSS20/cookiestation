import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Toast, ConfirmDialog } from "../utils/swal"; // Importando nossos pop-ups
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
  const [website, setWebsite] = useState("");
  const [myBooks, setMyBooks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDisplayName(data.displayName || user.displayName || "");
          setBio(data.bio || "");
          setPhotoURL(data.photoURL || user.photoURL || "");
          setLocation(data.location || "");
          setWebsite(data.website || "");
        }
        const q = query(collection(db, "stories"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        setMyBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadData();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), { 
      displayName, bio, photoURL, location, website, updatedAt: new Date() 
    }, { merge: true });
    setIsEditing(false);
    
    // Alerta estilizado
    Toast.fire({ icon: 'success', title: 'Perfil atualizado com sucesso! 🍪' });
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!bookId) return;
    
    // Pop-up de confirmação estilizado
    const result = await ConfirmDialog(
      "Tem certeza?", 
      "Isso apagará o livro e todos os capítulos permanentemente!"
    );

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const batch = writeBatch(db);
        const capsSnap = await getDocs(collection(db, "stories", bookId, "chapters"));
        capsSnap.forEach((cap) => batch.delete(cap.ref));
        batch.delete(doc(db, "stories", bookId));
        await batch.commit();

        setMyBooks(prev => prev.filter(b => b.id !== bookId));
        Toast.fire({ icon: 'success', title: 'Obra removida da estante. 🗑️' });
      } catch (e: any) {
        Toast.fire({ icon: 'error', title: 'Erro ao deletar obra.' });
      } finally { setLoading(false); }
    }
  };

  const handleDeleteAccount = async () => {
    const result = await ConfirmDialog(
      "Ação Crítica!", 
      "Deseja EXCLUIR sua conta e todas as suas obras? Isso é irreversível."
    );

    if (result.isConfirmed) {
      try {
        const batch = writeBatch(db);
        for (const book of myBooks) {
          const caps = await getDocs(collection(db, "stories", book.id, "chapters"));
          caps.forEach(c => batch.delete(c.ref));
          batch.delete(doc(db, "stories", book.id));
        }
        batch.delete(doc(db, "users", user!.uid));
        await batch.commit();
        await deleteUser(user!);
        navigate("/register");
      } catch (e) { 
        Toast.fire({ 
          icon: 'warning', 
          title: 'Por segurança, saia e entre novamente antes de excluir a conta.' 
        });
      }
    }
  };

  if (loading) return <div className="loader">☕ Sincronizando sua estante...</div>;

  return (
    <div className="profile-container fade-in">
      <header className="profile-card-header">
        <div className="profile-main-info">
          <div className="avatar-wrapper" style={{ backgroundImage: `url(${photoURL})` }} />
          {isEditing ? (
            <div className="edit-form-classic">
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nome de Escritor" />
              <input value={photoURL} onChange={e => setPhotoURL(e.target.value)} placeholder="URL da foto de perfil" />
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Localização" />
              <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="Seu Website" />
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Sua biografia..." />
              <div className="edit-btns">
                <button onClick={handleUpdateProfile} className="btn-save">Salvar</button>
                <button onClick={() => setIsEditing(false)} className="btn-cancel">Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="info-display">
              <h1>{displayName}</h1>
              {location && <p className="location-tag">📍 {location}</p>}
              {website && <a href={website} target="_blank" rel="noreferrer" className="web-link">🔗 {website}</a>}
              <p className="bio-text">{bio || "Nenhuma bio definida."}</p>
              <button onClick={() => setIsEditing(true)} className="btn-edit-text">Editar Perfil</button>
            </div>
          )}
        </div>
      </header>

      <div className="profile-header-actions">
        <h2>Minhas Obras</h2>
        <button className="btn-new-book" onClick={() => navigate("/create")}>+ Novo Livro</button>
      </div>

      <div className="books-grid">
        {myBooks.map(book => (
          <div key={book.id} className="book-card-item">
            <div className="book-visual" style={{ backgroundImage: `url(${book.coverUrl})` }}>
              <div className="book-badge">{book.genre}</div>
            </div>
            <div className="book-details">
              <h3>{book.title}</h3>
              <p>{book.chapterCount || 0} capítulos</p>
              <div className="book-actions">
                <button className="btn-view" onClick={() => navigate(`/story/${book.id}`)}>Ver</button>
                <button className="btn-add-cap" onClick={() => navigate(`/story/${book.id}/new-chapter`)}>+ Cap</button>
                <button className="btn-delete-book" onClick={() => handleDeleteBook(book.id)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="danger-zone-footer">
        <button className="btn-danger-text" onClick={handleDeleteAccount}>Excluir minha conta permanentemente</button>
      </footer>
    </div>
  );
};

export default Profile;