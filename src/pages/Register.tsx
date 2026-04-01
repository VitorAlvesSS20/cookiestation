import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase";
import { Toast } from "../utils/swal"; 
import "../styles/auth.css";

const API_URL = import.meta.env.VITE_API_URL;

const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      Toast.fire({
        icon: 'warning',
        title: 'As senhas não coincidem. Verifique seu blend!'
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/users/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error("Erro ao sincronizar perfil com o servidor.");
      
      Toast.fire({
        icon: 'success',
        title: 'Conta criada! Mesa reservada com sucesso. 🥐'
      });
      
      navigate("/"); 
    } catch (err: any) {
      let message = "Erro ao preparar seu cadastro. Tente novamente.";
      if (err.code === 'auth/email-already-in-use') message = "Este e-mail já está cadastrado em nossa reserva.";
      else if (err.code === 'auth/weak-password') message = "Senha muito fraca. Tente uma combinação mais encorpada!";

      Toast.fire({ icon: 'error', title: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-visual register-visual">
          <div className="visual-overlay">
            <h3>Novo Escritor?</h3>
            <p>Pegue sua xícara e comece a rascunhar seu universo.</p>
          </div>
        </div>

        <div className="auth-form-container">
          <header className="auth-header">
            <h2>Crie sua conta 🥐</h2>
            <p>Temos uma mesa reservada para você!</p>
          </header>

          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-group">
              <label htmlFor="name">Como quer ser chamado?</label>
              <input
                id="name"
                type="text"
                placeholder="Seu nome ou apelido"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="seu@melhoremail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group-row">
              <div className="input-group">
                <label htmlFor="password">Senha</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirmar</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="loader">Preparando acesso...</span> : "Cadastrar"}
            </button>
          </form>

          <footer className="auth-footer">
            <p>
              Já é de casa?{" "}
              <button type="button" onClick={() => navigate("/login")}>
                Fazer Login
              </button>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Register;