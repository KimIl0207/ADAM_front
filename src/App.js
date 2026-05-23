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

  return (
    <div className="app" id="top">
      <div className="container">
        <Header />

        <main>
          <h1 className="title">AI Detector</h1>
          <p className="subtitle">{subtitle}</p>

          <section id="image-detection">
            <ImageDetection />
          </section>

          <section id="video-detection">
            <VideoDetection />
          </section>

          <section id="text-detection">
            <TextDetection />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
