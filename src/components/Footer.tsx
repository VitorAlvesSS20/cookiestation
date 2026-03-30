import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/footer.css";

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <footer className="footer-compact fade-in-up">
      <div className="footer-container">
        <div className="footer-main-row">
          
          <div className="footer-brand-mini">
            <div className="logo-group" onClick={() => navigate("/")}>
              <span className="coffee-icon">☕</span>
              <h2>CookieStation<span>.</span></h2>
            </div>
            <p>Seu refúgio literário.</p>
          </div>

          <nav className="footer-nav-groups">
            <div className="nav-col">
              <h4>Estação</h4>
              <span onClick={() => navigate("/")}>Explorar</span>
              <span onClick={() => navigate("/create")}>Cozinhar</span>
              <span onClick={() => navigate("/profile")}>Estante</span>
            </div>

            <div className="nav-col">
              <h4>Suporte</h4>
              <span onClick={() => navigate("/guidelines")}>Diretrizes</span>
              <span onClick={() => navigate("/privacy")}>Privacidade</span>
              <span onClick={() => navigate("/about")}>Sobre nós</span>
            </div>
          </nav>
        </div>

        <div className="footer-bottom-bar">
          <div className="footer-line"></div>
          <div className="bottom-content">
            <p>© {year} — Criado por <strong>Vitor Alves</strong></p>
            <div className="social-placeholders">
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;