import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/staticPages.css";

const Guidelines: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="static-page-layout fade-in">
      <div className="static-container">
        <header className="static-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Voltar para a Estação
          </button>
          <h1>Diretrizes da Comunidade</h1>
          <p className="subtitle">
            Como manter nosso café sempre quente e agradável para todos.
          </p>
        </header>

        <main className="static-content">
          <section>
            <h2>1. Respeito Acima de Tudo ☕</h2>
            <p>
              O Cookiestation é um refúgio para a criatividade. Não toleramos
              discurso de ódio, assédio, bullying ou qualquer forma de
              discriminação. Comentários e críticas devem ser construtivos e
              focar na obra, nunca no autor.
            </p>
          </section>

          <section>
            <h2>2. Propriedade Intelectual e Plágio</h2>
            <p>
              Respeite o trabalho alheio. O plágio é estritamente proibido. Ao
              publicar na nossa estação, você garante que possui todos os
              direitos sobre o conteúdo ou as permissões necessárias. Obras que
              infringirem direitos autorais serão removidas imediatamente.
            </p>
          </section>

          <section>
            <h2>3. Conteúdo Sensível e Classificação</h2>
            <p>
              Histórias que contenham temas adultos, violência explícita ou
              gatilhos devem ser obrigatoriamente sinalizadas no resumo da obra.
            </p>
          </section>

          <section>
            <h2>4. Spam e Promoção</h2>
            <p>
              Evite poluir os comentários ou o feed com mensagens repetitivas ou
              publicidade não solicitada. A divulgação de suas próprias obras é
              permitida nos locais apropriados, desde que de forma orgânica e
              respeitosa.
            </p>
          </section>

          <section>
            <h2>5. Qualidade e Formatação</h2>
            <p>
              Embora encorajemos todos os níveis de escrita, pedimos atenção à
              formatação básica para garantir uma boa experiência de leitura.
              Use parágrafos e pontuação adequada para que sua história brilhe
              como deve.
            </p>
          </section>

          <div className="static-footer-note">
            <p>
              Violar estas diretrizes pode resultar na suspensão temporária ou
              permanente da sua conta. Se você encontrar algo que quebre estas
              regras, por favor, utilize nossos canais de suporte.
            </p>
            <span>Última atualização: Março de 2026</span>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Guidelines;
