import Footer from './components/Footer';
import Header from './components/Header';
import ImageDetection from './components/ImageDetection';
import TextDetection from './components/TextDetection';
import VideoDetection from './components/VideoDetection';
import { getApiBaseUrl } from './api/detectionApi';
import './App.css';

function App() {
  console.log("API Base URL:", getApiBaseUrl());
  const subtitle = "\uc774\ubbf8\uc9c0\uc640 \ud14d\uc2a4\ud2b8\ub97c \ud604\uc7ac \u0041\u0049 \ud0d0\uc9c0 \uc11c\ubc84\ub85c \ubd84\uc11d\ud574 \ubcf4\uc138\uc694.";
  const stats = [
    { value: "Image", label: "\uc2a4\ub0c5\uc0f7 \ud0d0\uc9c0" },
    { value: "Video", label: "\ud504\ub808\uc784 \ubd84\uc11d" },
    { value: "Text", label: "\ubb38\uc7a5 \uac10\uc9c0" },
  ];

  return (
    <div className="app" id="top">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <div className="container">
        <Header />

        <main>
          <section className="hero-section" aria-labelledby="hero-title">
            <div className="hero-copy">
              <span className="eyebrow">Visual & Text Intelligence</span>
              <h1 className="title" id="hero-title">AI Detector</h1>
              <p className="subtitle">{subtitle}</p>
            </div>

            <div className="hero-stats" aria-label="\ud0d0\uc9c0 \uc720\ud615">
              {stats.map((item) => (
                <div className="stat-pill" key={item.value}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="image-detection" className="detector-section detector-image">
            <ImageDetection />
          </section>

          <section id="video-detection" className="detector-section detector-video">
            <VideoDetection />
          </section>

          <section id="text-detection" className="detector-section detector-text">
            <TextDetection />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
