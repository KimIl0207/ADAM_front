import { useEffect, useState } from 'react';
import Footer from './components/Footer';
import Header from './components/Header';
import ImageDetection from './components/ImageDetection';
import TextDetection from './components/TextDetection';
import VideoDetection from './components/VideoDetection';
import { getApiBaseUrl } from './api/detectionApi';
import './App.css';

const routes = {
  "/": {
    title: "Image Detection",
    eyebrow: "Grad-CAM Visual Analysis",
    subtitle: "\uc774\ubbf8\uc9c0\ub97c \ub4dc\ub798\uadf8 \uc564 \ub4dc\ub86d\ud558\uace0, \uc6d0\ubcf8\uacfc Grad-CAM \uacb0\uacfc\ub97c \ud55c \ud654\uba74\uc5d0\uc11c \ube44\uad50\ud558\uc138\uc694.",
    component: <ImageDetection />,
    hideHero: true,
  },
  "/image": {
    title: "Image Detection",
    eyebrow: "Grad-CAM Visual Analysis",
    subtitle: "\uc774\ubbf8\uc9c0\ub97c \ub4dc\ub798\uadf8 \uc564 \ub4dc\ub86d\ud558\uace0, \uc6d0\ubcf8\uacfc Grad-CAM \uacb0\uacfc\ub97c \ud55c \ud654\uba74\uc5d0\uc11c \ube44\uad50\ud558\uc138\uc694.",
    component: <ImageDetection />,
    hideHero: true,
  },
  "/video": {
    title: "Video Detection",
    eyebrow: "Frame Suspicion Analysis",
    subtitle: "\ub3d9\uc601\uc0c1\uc744 \uc5c5\ub85c\ub4dc\ud558\uba74 \ud504\ub808\uc784 \uc810\uc218\ub97c \uc885\ud569\ud574 \uc758\uc2ec \ud655\ub960\uc744 \ubcf4\uc5ec\uc90d\ub2c8\ub2e4.",
    component: <VideoDetection />,
  },
  "/text": {
    title: "Text Detection",
    eyebrow: "Sentence Highlight Analysis",
    subtitle: "\uc6d0\ubb38 \ud14d\uc2a4\ud2b8\uc640 AI\ub85c \uc778\uc2dd\ub41c \ubb38\uc7a5\uc744 \uac15\ub3c4\ubcc4 \uc0c9\uc73c\ub85c \ub098\ub780\ud788 \ud655\uc778\ud558\uc138\uc694.",
    component: <TextDetection />,
  },
};

function App() {
  console.log("API Base URL:", getApiBaseUrl());
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const activeRoute = routes[currentPath] || routes["/image"];

  useEffect(() => {
    const syncPath = () => setCurrentPath(window.location.pathname);

    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  const navigate = (path) => {
    if (path === currentPath) return;

    window.history.pushState({}, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app" id="top">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <div className="container">
        <Header currentPath={currentPath === "/" ? "/image" : currentPath} onNavigate={navigate} />

        <main>
          {!activeRoute.hideHero && (
            <section className="page-hero" aria-labelledby="page-title">
              <div className="hero-copy">
                <span className="eyebrow">{activeRoute.eyebrow}</span>
                <h1 className="title" id="page-title">{activeRoute.title}</h1>
                <p className="subtitle">{activeRoute.subtitle}</p>
              </div>
            </section>
          )}

          <section className="detector-section">
            {activeRoute.component}
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
