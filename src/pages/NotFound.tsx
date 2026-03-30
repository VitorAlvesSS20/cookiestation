import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/notFound.css';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <div className="error-content">
        <div className="error-icon">☕</div>
        <h1 className="error-code">404</h1>
        <h2 className="error-message">Ops! O café esfriou.</h2>
        <p className="error-description">
          A página que você está procurando sumiu da nossa estante ou nunca foi escrita. 
          Que tal voltar para o balcão principal?
        </p>
        <button className="btn-back-home" onClick={() => navigate('/')}>
          Voltar ao Início
        </button>
      </div>
      <div className="error-background-elements">
        <div className="coffee-stain"></div>
        <div className="coffee-stain secondary"></div>
      </div>
    </div>
  );
};

export default NotFound;