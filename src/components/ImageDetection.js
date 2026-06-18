import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPrediction, saveCorrection } from '../api/detectionApi';
import AnalysisHistory from './image-analysis/AnalysisHistory';
import AnalysisNarrative from './image-analysis/AnalysisNarrative';
import ImageUploadPanel from './image-analysis/ImageUploadPanel';
import ModelScores from './image-analysis/ModelScores';
import ResultSummary from './image-analysis/ResultSummary';

const T = {
  aiSuspicious: "\u0041\u0049 \uc0dd\uc131 \uc758\uc2ec \uc774\ubbf8\uc9c0",
  likelyReal: "\uc2e4\uc81c \uc774\ubbf8\uc9c0 \uac00\ub2a5\uc131 \ub192\uc74c",
  aiImage: "\u0041\u0049 \uc0dd\uc131 \uc774\ubbf8\uc9c0",
  realImage: "\uc2e4\uc81c \uc774\ubbf8\uc9c0",
  high: "\ub192\uc74c",
  medium: "\ubcf4\ud1b5",
  low: "\ub0ae\uc74c",
  imageOnly: "\uc774\ubbf8\uc9c0 \ud30c\uc77c\ub9cc \uc5c5\ub85c\ub4dc\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  saved: "\ub85c \uc800\uc7a5\ud588\uc2b5\ub2c8\ub2e4.",
  saveFailed: "\uc800\uc7a5\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
};

function translateImageLabel(label) {
  const labels = {
    "Suspicious AI-like Image": T.aiSuspicious,
    "Likely Real Image": T.likelyReal,
    "AI Generated": T.aiImage,
    "Real Image": T.realImage,
  };

  return labels[label] || label || "-";
}

function translateConfidence(confidence) {
  const labels = {
    high: T.high,
    medium: T.medium,
    low: T.low,
  };

  return labels[confidence] || confidence || "-";
}

function ImageDetection() {
  const fileInputRef = useRef(null);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) return undefined;

    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const selectImageFile = useCallback((file, fallbackName = "clipboard-image.png") => {
    if (!file) return;

    if (file.type && !file.type.startsWith('image/')) {
      setResult({ error: T.imageOnly });
      return;
    }

    setSelectedFile(file);
    setFileName(file.name || fallbackName);
    setImageUrl(URL.createObjectURL(file));
    setSaveMessage("");
    setResult(null);
  }, []);

  useEffect(() => {
    const handlePaste = (event) => {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith('image/'));
      const file = imageItem?.getAsFile();

      if (!file) return;

      event.preventDefault();
      selectImageFile(file, "pasted-image.png");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [selectImageFile]);

  const handleFileChange = (event) => {
    selectImageFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    selectImageFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setSaveMessage("");
    setLoading(true);
    setResult(null);

    const data = await fetchPrediction(selectedFile);
    setResult(data);
    setLoading(false);
  };

  const handleSaveCorrection = async (label) => {
    if (!selectedFile || !result) return;

    const data = await saveCorrection(selectedFile, label, result);

    if (data?.success) {
      setSaveMessage(`${label === "real" ? T.realImage : T.aiImage}${T.saved}`);
    } else {
      setSaveMessage(T.saveFailed);
    }
  };

  const scorePercent = result?.suspicious_score !== undefined
    ? Math.round(result.suspicious_score * 100)
    : null;
  const gradCamUrl = result?.grad_cam?.image_base64
    ? `data:image/png;base64,${result.grad_cam.image_base64}`
    : null;

  return (
    <div className="image-dashboard">
      <section className="image-hero" aria-labelledby="image-hero-title">
        <div className="image-hero-copy">
          <span className="image-kicker">AI Image Detection System</span>
          <h1 id="image-hero-title">ADAM</h1>
          <p>
            업로드한 이미지를 여러 판별 모델로 분석하고, 종합 AI 가능성 점수와 모델별 근거를 대시보드 형태로 제공합니다.
          </p>
        </div>

        <div className="flow-panel" aria-label="Image analysis flow">
          <div><span>01</span><strong>Upload</strong><small>이미지 선택</small></div>
          <div><span>02</span><strong>Analyze</strong><small>모델 앙상블</small></div>
          <div><span>03</span><strong>Explain</strong><small>점수와 근거 확인</small></div>
        </div>
      </section>

      <div className="image-dashboard-grid">
        <ImageUploadPanel
          fileInputRef={fileInputRef}
          fileName={fileName}
          imageUrl={imageUrl}
          loading={loading}
          selectedFile={selectedFile}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
          onOpenFilePicker={openFilePicker}
          onUpload={handleUpload}
        />

        <ResultSummary
          gradCamUrl={gradCamUrl}
          loading={loading}
          result={result}
          scorePercent={scorePercent}
          translateConfidence={translateConfidence}
          translateImageLabel={translateImageLabel}
        />

        <ModelScores loading={loading} modelProbs={result?.model_probs} />
        <AnalysisNarrative result={result} />
        <AnalysisHistory
          fileName={fileName}
          result={result}
          saveMessage={saveMessage}
          onSaveCorrection={handleSaveCorrection}
        />
      </div>
    </div>
  );
}

export default ImageDetection;
