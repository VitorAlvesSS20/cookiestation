import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/staticPages.css";

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="static-page-layout fade-in">
      <div className="static-container">
        <header className="static-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Voltar para a Estação
          </button>
          <h1>Aviso de Privacidade</h1>
          <p className="subtitle">Sua segurança e seus dados são tratados com o mesmo carinho que nossas receitas.</p>
        </header>

        <main className="static-content">
          <section>
            <h2>1. Coleta de Informações 🍪</h2>
            <p>
              Para que você possa publicar e interagir na estação, coletamos informações básicas como 
              seu nome de usuário, e-mail e foto de perfil (via Google Auth). Esses dados são essenciais 
              para identificar sua autoria e personalizar sua experiência.
            </p>
          </section>

          <section>
            <h2>2. Uso dos Seus Dados</h2>
            <p>
              Utilizamos seus dados exclusivamente para:
            </p>
            <ul className="static-list">
              <li>Gerenciar sua conta e permitir o login seguro.</li>
              <li>Vincular suas histórias e capítulos ao seu perfil.</li>
              <li>Notificar sobre atualizações importantes na plataforma.</li>
              <li>Melhorar nossas ferramentas de escrita e leitura.</li>
            </ul>
          </section>

          <section>
            <h2>3. Armazenamento e Segurança</h2>
            <p>
              Utilizamos a infraestrutura do <strong>Google Firebase</strong> para garantir que suas 
              histórias e dados pessoais estejam protegidos por criptografia de ponta. Não vendemos 
              suas informações para terceiros sob nenhuma circunstância.
            </p>
          </section>

          <section>
            <h2>4. Cookies</h2>
            <p>
              Fazemos jus ao nome! Utilizamos cookies técnicos para manter você conectado e 
              lembrar suas preferências de leitura (como o progresso nos capítulos). Você pode 
              desativá-los no seu navegador, mas algumas funções da estação podem não funcionar 
              corretamente.
            </p>
          </section>

          <section>
            <h2>5. Seus Direitos</h2>
            <p>
              Você tem total controle sobre suas obras e seus dados. A qualquer momento, você pode 
              editar ou excluir suas histórias, bem como solicitar a exclusão permanente da sua 
              conta através das configurações de perfil.
            </p>
          </section>

          <div className="static-footer-note">
            <p>
              Ao continuar navegando no Cookiestation, você concorda com estes termos. 
              Reservamo-nos o direito de atualizar este aviso conforme a plataforma evolui.
            </p>
            <span>Última atualização: Março de 2026</span>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Privacy;