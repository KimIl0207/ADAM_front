import Footer from './components/Footer';
import Header from './components/Header';
import ImageDetection from './components/ImageDetection';
import TextDetection from './components/TextDetection';
import VideoDetection from './components/VideoDetection';
import { getApiBaseUrl } from './api/detectionApi';
import './App.css';

function App() {
  console.log("API Base URL:", getApiBaseUrl());

  return (
    <div className="app" id="top">
      <div className="container">
        <Header />

        <main>
          <h1 className="title">AI Detector</h1>
          <p className="subtitle">Test images and text against the current AI detection servers.</p>

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
