import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/staticPages.css";

const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="static-page-layout fade-in">
      <div className="static-container">
        <header className="static-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Voltar para a Estação
          </button>
          <h1>Sobre o Cookiestation</h1>
          <p className="subtitle">
            Onde cada parágrafo tem o aroma de um café fresquinho.
          </p>
        </header>

        <main className="static-content">
          <section className="about-hero">
            <p>
              O <strong>Cookiestation</strong> não é apenas um site de escrita;
              é uma estação de repouso para mentes criativas. Em um mundo
              digital cada vez mais apressado, decidimos criar um espaço onde as
              histórias podem maturar no seu próprio tempo.
            </p>
          </section>

          <section>
            <h2>Nossa Essência ☕</h2>
            <p>
              Nascemos da vontade de unir a organização técnica de grandes
              plataformas. Aqui, o foco é a <strong>narrativa pura</strong>.
              Queremos que o autor se sinta confortável para rascunhar seus
              mundos e que o leitor encontre um refúgio livre de distrações.
            </p>
          </section>

          <section className="about-features-grid">
            <div className="feature-item">
              <h3>Escrita Imersiva</h3>
              <p>
                Ferramentas focadas no que importa: suas palavras e sua
                criatividade.
              </p>
            </div>
            <div className="feature-item">
              <h3>Comunidade Acolhedora</h3>
              <p>
                Um ambiente seguro baseado no respeito mútuo e no feedback
                construtivo.
              </p>
            </div>
            <div className="feature-item">
              <h3>Estética Moderna</h3>
              <p>
                Um design elegante e de alto contraste, feito para não cansar a
                vista durante longas leituras.
              </p>
            </div>
          </section>

          <section>
            <h2>O Futuro da Estação</h2>
            <p>
              O Cookiestation está em constante evolução. O que começou como um
              gerenciador de histórias está expandindo seus horizontes para se
              tornar um ecossistema completo para RPGs de texto e narrativas
              interativas. Nossa estação está sempre aberta para novos
              passageiros e novas ideias.
            </p>
          </section>

          <div className="static-footer-note about-footer">
            <p>Sente-se, peça um café e fique à vontade.</p>
            <span>Feito por Vitor Alves • 2026</span>
          </div>
        </main>
      </div>
    </div>
  );
};

export default About;
