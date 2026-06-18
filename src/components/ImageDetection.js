import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPrediction, saveCorrection } from '../api/detectionApi';

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

function getModelLabel(modelKey) {
  const labels = {
    sd: "SD",
    mj: "MJ v6",
    bg: "BG",
    sd3: "SD3",
    dalle3: "DALL-E 3",
    univfd: "UnivFD",
  };

  return labels[modelKey] || modelKey;
}

function ImageDetection() {
  const fileInputRef = useRef(null);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
    setDetailsOpen(false);
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
    setDetailsOpen(false);

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

  const handleSaveCorrection = async (label) => {
    if (!selectedFile) return;

    const data = await saveCorrection(selectedFile, label, result);

    if (data?.success) {
      setSaveMessage(`${label === "real" ? T.realImage : T.aiImage}${T.saved}`);
    } else {
      setSaveMessage(T.saveFailed);
    }
  };

  return (
    <div className="analysis-layout image-analysis">
      <div className="card analysis-panel source-panel detector-card image-upload-card">
        <div className="panel-heading">
          <span className="eyebrow">{T.originalImage}</span>
          <h2>Image Detection</h2>
        </div>

        <div
          className={`drop-zone ${imageUrl ? "has-preview" : ""}`}
          role="button"
          tabIndex={0}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") openFilePicker();
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={T.uploadedImage} className="analysis-media" />
          ) : (
            <span>{T.dropImage}</span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          id="fileInput"
          accept="image/*"
          className="file-input"
          onChange={handleFileChange}
        />

        <p className="paste-hint">{T.pasteHint}</p>
        {fileName && <p className="file-name">{fileName}</p>}

        <button className="primary-btn" onClick={handleUpload} disabled={loading || !selectedFile}>
          {loading ? T.analyzing : T.uploadAnalyze}
        </button>
      </div>

      <div className="card analysis-panel result-panel">
        <div className="panel-heading">
          <span className="eyebrow">Grad-CAM</span>
          <h2>{T.resultTitle}</h2>
        </div>

        {result?.error ? (
          <p className="error-text">{T.error}: {result.error}</p>
        ) : (
          <>
            <div className={`result-visual ${gradCamUrl ? "has-preview" : ""}`}>
              {gradCamUrl ? (
                <img src={gradCamUrl} alt={T.heatmap} className="analysis-media" />
              ) : (
                <span>{loading ? T.analyzing : T.heatmap}</span>
              )}
            </div>

            <div className="result-main">
              {result && <div className="result-badge">{translateImageLabel(result.label)}</div>}
              <div className="score-panel">
                <span>{T.suspiciousScore}</span>
                <strong>{scorePercent !== null ? `${scorePercent}%` : "-"}</strong>
              </div>
            </div>

            <button className="detail-btn" onClick={() => setDetailsOpen(true)} disabled={!result}>
              {T.detailedInfo}
            </button>
          </>
        )}
      </div>

      {detailsOpen && result && (
        <div className="modal-backdrop" role="presentation" onClick={() => setDetailsOpen(false)}>
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="image-details-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 id="image-details-title">{T.detailedInfo}</h3>
              <button className="modal-close" onClick={() => setDetailsOpen(false)} aria-label={T.close}>x</button>
            </div>

            <div className="info-box modal-info">
              <p><span>{T.filename}</span><strong>{result.filename || fileName || "-"}</strong></p>
              <p><span>{T.confidence}</span><strong>{translateConfidence(result.confidence)}</strong></p>
              {Object.entries(result.model_probs || {}).map(([modelKey, prob]) => (
                <p key={modelKey}><span>{getModelLabel(modelKey)}</span><strong>{prob}</strong></p>
              ))}
              <p><span>{T.modelFusion}</span><strong>{result.signals?.model_fusion ?? "-"}</strong></p>
              <p><span>{T.model}</span><strong>{result.grad_cam?.model || "-"}</strong></p>
            </div>

            <div className="correction-box">
              <p className="correction-title">{T.correctionTitle}</p>
              <div className="button-row">
                <button className="secondary-btn" onClick={() => handleSaveCorrection("real")}>
                  {T.saveReal}
                </button>
                <button className="danger-btn" onClick={() => handleSaveCorrection("fake")}>
                  {T.saveAi}
                </button>
              </div>

              {saveMessage && <p className="save-message">{saveMessage}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageDetection;
