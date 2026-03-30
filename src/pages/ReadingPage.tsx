import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { doc, getDoc, collection, getDocs, orderBy, query } from "firebase/firestore";
import "../styles/readingPage.css";

const ReadingPage: React.FC = () => {
  const { id, chapterId } = useParams();
  const navigate = useNavigate();

  const [chapter, setChapter] = useState<any>(null);
  const [allChapters, setAllChapters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChapterData = async () => {
      if (!id || !chapterId) return;

      setLoading(true);

      try {
        const capDoc = await getDoc(
          doc(db, "stories", id, "chapters", chapterId)
        );

        if (capDoc.exists()) {
          setChapter(capDoc.data());
        }

        const q = query(
          collection(db, "stories", id, "chapters"),
          orderBy("createdAt", "asc")
        );

        const snap = await getDocs(q);
        setAllChapters(snap.docs.map((d) => d.id));
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    };

    fetchChapterData();
    window.scrollTo(0, 0);
  }, [id, chapterId]);

  const currentIndex = allChapters.indexOf(chapterId!);
  const prevId = allChapters[currentIndex - 1];
  const nextId = allChapters[currentIndex + 1];

  if (loading) {
  return (
    <div className="reading-loader-container">
      <div className="loader-coffee">☕</div>
      <p>Virando a página...</p>
    </div>
  );
}

  return (
    <div className="reading-page-layout">
      <nav className="reading-fixed-nav">
        <div className="nav-content">
          <button
            className="btn-exit"
            onClick={() => navigate(`/story/${id}`)}
          >
            ✕ Sair da Leitura
          </button>

          <div className="reading-info">
            <span className="current-cap-label">
              Capítulo {currentIndex + 1}
            </span>
          </div>
        </div>
      </nav>

      <main className="reading-container fade-in">
        <article className="reading-article">
          <header className="article-header">
            <h1>{chapter?.title}</h1>
          </header>

          {/* 🔥 IMAGEM CORRIGIDA */}
          {chapter?.chapterCover && (
            <div className="chapter-visual-wrapper">
              <img
                src={chapter.chapterCover}
                alt="Ilustração do Capítulo"
                className="chapter-main-img"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          )}

          <div className="article-body">
            {chapter?.content
              ?.split("\n")
              .map(
                (paragraph: string, i: number) =>
                  paragraph.trim() && <p key={i}>{paragraph}</p>
              )}
          </div>
        </article>

        <footer className="reading-footer">
          <button
            className="nav-btn"
            disabled={!prevId}
            onClick={() =>
              navigate(`/story/${id}/read/${prevId}`)
            }
          >
            ← Anterior
          </button>

          <button
            className="btn-finish-reading"
            onClick={() => navigate(`/story/${id}`)}
          >
            Voltar ao Índice
          </button>

          <button
            className="nav-btn primary"
            disabled={!nextId}
            onClick={() =>
              navigate(`/story/${id}/read/${nextId}`)
            }
          >
            Próximo →
          </button>
        </footer>
      </main>
    </div>
  );
};

export default ReadingPage;