import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPrediction, saveCorrection } from '../api/detectionApi';
import AnalysisHistory from './image-analysis/AnalysisHistory';
import AnalysisNarrative from './image-analysis/AnalysisNarrative';
import FocusAnalysis from './image-analysis/FocusAnalysis';
import ImageUploadPanel from './image-analysis/ImageUploadPanel';
import ModelScores from './image-analysis/ModelScores';
import ResultSummary from './image-analysis/ResultSummary';

const T = {
  aiSuspicious: "\u0041\u0049 \uc0dd\uc131 \uc758\uc2ec \uc774\ubbf8\uc9c0",
  likelyReal: "\uc2e4\uc81c \uc774\ubbf8\uc9c0 \uac00\ub2a5\uc131 \ub192\uc74c",
  aiImage: "\u0041\u0049 \uc0dd\uc131 \uc774\ubbf8\uc9c0",
  realImage: "\uc2e4\uc81c \uc774\ubbf8\uc9c0",
  trusted: "ADAM \ud310\ub2e8",
  imageOnly: "\uc774\ubbf8\uc9c0 \ud30c\uc77c\ub9cc \uc5c5\ub85c\ub4dc\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  saved: "\ub85c \uc800\uc7a5\ud588\uc2b5\ub2c8\ub2e4.",
  saveFailed: "\uc800\uc7a5\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  selectImage: "\uc774\ubbf8\uc9c0 \uc120\ud0dd",
  dropImage: "\uc774\ubbf8\uc9c0\ub97c \ub4dc\ub798\uadf8\ud558\uac70\ub098 \ud074\ub9ad\ud574 \uc120\ud0dd",
  originalImage: "\uc6d0\ubcf8 \uc774\ubbf8\uc9c0",
  pasteHint: "\ubcf5\uc0ac\ud55c \uc2a4\ud06c\ub9b0\uc0f7\uc774\ub098 \uc774\ubbf8\uc9c0\ub97c Ctrl+V\ub85c \ubd99\uc5ec\ub123\uc744 \uc218\ub3c4 \uc788\uc2b5\ub2c8\ub2e4.",
  analyzing: "\ubd84\uc11d \uc911...",
  uploadAnalyze: "\uc5c5\ub85c\ub4dc \ud6c4 \ubd84\uc11d",
  preview: "\ubbf8\ub9ac\ubcf4\uae30",
  uploadedImage: "\uc5c5\ub85c\ub4dc\ud55c \uc774\ubbf8\uc9c0",
  resultTitle: "\uc774\ubbf8\uc9c0 \ubd84\uc11d \uacb0\uacfc",
  error: "\uc624\ub958",
  suspiciousScore: "\uc758\uc2ec \uc810\uc218",
  detailedInfo: "\uc0c1\uc138 \uc815\ubcf4",
  close: "\ub2eb\uae30",
  filename: "\ud30c\uc77c\uba85",
  confidence: "\uc2e0\ub8b0\ub3c4",
  modelFusion: "\ucd5c\uc885 \ud310\ubcc4 \uc810\uc218",
  detected: "\uac10\uc9c0",
  notDetected: "\ubbf8\uac10\uc9c0",
  heatmap: "Grad-CAM \ud788\ud2b8\ub9f5",
  model: "\ubaa8\ub378",
  correctionTitle: "\uc608\uce21\uc774 \ud2c0\ub838\ub2e4\uba74 \uc815\ub2f5\uc744 \uc800\uc7a5\ud574 \uc8fc\uc138\uc694.",
  saveReal: "\uc2e4\uc81c \uc774\ubbf8\uc9c0\ub85c \uc800\uc7a5",
  saveAi: "\u0041\u0049 \uc774\ubbf8\uc9c0\ub85c \uc800\uc7a5",
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
    "ADAM 판단": T.trusted,
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

  const scorePercent = result?.suspicious_score !== undefined
    ? Math.round(result.suspicious_score * 100)
    : null;
  const gradCamUrl = result?.grad_cam?.image_base64
    ? `data:image/png;base64,${result.grad_cam.image_base64}`
    : null;
  const focus = result?.grad_cam?.focus;

  const handleSaveCorrection = async (label) => {
    if (!selectedFile || !result) return;

    const data = await saveCorrection(selectedFile, label, result);

    if (data?.success) {
      setSaveMessage(`${label === "real" ? T.realImage : T.aiImage}${T.saved}`);
    } else {
      setSaveMessage(T.saveFailed);
    }
  };

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

        <ModelScores
          fusionModelScores={result?.signals?.fusion_model_scores}
          loading={loading}
          modelProbs={result?.model_probs}
        />
        <AnalysisNarrative result={result} />
        <FocusAnalysis focus={focus} loading={loading} />
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
