import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { Toast } from "../utils/swal"; 
import "../styles/auth.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const user = res.user;

      const token = await user.getIdToken();
      await fetch('http://localhost:8000/users/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      Toast.fire({
        icon: 'success',
        title: 'Bem-vindo de volta! ☕'
      });
      
      navigate("/");
    } catch (err: any) {
      let message = "Ocorreu um erro ao preparar seu acesso. Tente novamente.";
      
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        message = "E-mail ou senha incorretos. Verifique os ingredientes!";
      } else if (err.code === 'auth/too-many-requests') {
        message = "Muitas tentativas! Aguarde um pouco para o café esfriar.";
      }

      Toast.fire({
        icon: 'error',
        title: message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-visual">
          <div className="visual-overlay">
            <h3>CookieStation</h3>
            <p>Sua pausa para criatividade começa aqui.</p>
          </div>
        </div>

        <div className="auth-form-container">
          <header className="auth-header">
            <h2>Bem-vindo de volta! ☕</h2>
            <p>Estávamos esperando por você!</p>
          </header>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="exemplo@cookie.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

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

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                <span className="loader">Entrando...</span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <footer className="auth-footer">
            <p>
              Ainda não tem uma conta?{" "}
              <button type="button" onClick={() => navigate("/register")}>
                Criar conta
              </button>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;