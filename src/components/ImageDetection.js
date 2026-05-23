import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPrediction, saveCorrection } from '../api/detectionApi';

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
      setResult({ error: "Invalid file type. Please upload an image." });
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
    if (!selectedFile) return;

    const data = await saveCorrection(selectedFile, label, result);

    if (data?.success) {
      setSaveMessage(`${label === "real" ? "Real photo" : "AI image"} saved.`);
    } else {
      setSaveMessage("Save failed.");
    }
  };

  return (
    <>
      <div className="card upload-card">
        <h2>Image Detection</h2>
        <label htmlFor="fileInput" className="file-label">
          Select image
        </label>
        <input
          ref={fileInputRef}
          type="file"
          id="fileInput"
          accept="image/*"
          className="file-input"
          onChange={handleFileChange}
        />
        <p className="paste-hint">You can also paste a copied screenshot or image with Ctrl+V.</p>
        {fileName && <p className="file-name">{fileName}</p>}

        <button className="primary-btn" onClick={handleUpload} disabled={loading || !selectedFile}>
          {loading ? "Analyzing..." : "Upload and analyze"}
        </button>
      </div>

      {(imageUrl || result) && (
        <div className="content-grid">
          {imageUrl && (
            <div className="card preview-card">
              <h2>Preview</h2>
              <img src={imageUrl} alt="Uploaded" className="preview-image" />
            </div>
          )}

          {result && (
            <div className="card result-card">
              <h2>Image Result</h2>

              {result.error ? (
                <p className="error-text">Error: {result.error}</p>
              ) : (
                <>
                  <div className="result-main">
                    <div className="result-badge">{result.label}</div>
                    <div className="result-prob">
                      Suspicious Score: <strong>{result.suspicious_score ?? "-"}</strong>
                    </div>
                  </div>

                  <div className="info-box">
                    <p><span>Filename</span><strong>{result.filename || fileName || "-"}</strong></p>
                    <p><span>Confidence</span><strong>{result.confidence || "-"}</strong></p>
                    <p><span>SD</span><strong>{result.model_probs?.sd ?? "-"}</strong></p>
                    <p><span>MJ</span><strong>{result.model_probs?.mj ?? "-"}</strong></p>
                    <p><span>BG</span><strong>{result.model_probs?.bg ?? "-"}</strong></p>
                    <p><span>Model Fusion</span><strong>{result.signals?.model_fusion ?? "-"}</strong></p>
                    <p><span>Disagreement</span><strong>{result.signals?.model_disagreement ?? "-"}</strong></p>
                    {result.grad_cam?.image_base64 && (
                      <div className="grad-cam-box">
                        <h3>Grad-CAM</h3>
                        <img
                          src={`data:image/png;base64,${result.grad_cam.image_base64}`}
                          alt="Grad-CAM heatmap"
                          className="preview-image"
                        />
                        <p>Model : {result.grad_cam.model || "-"}</p>
                      </div>
                    )}
                  </div>

                  <div className="correction-box">
                    <p className="correction-title">Save correction if the prediction is wrong</p>
                    <div className="button-row">
                      <button
                        className="secondary-btn"
                        onClick={() => handleSaveCorrection("real")}
                      >
                        Save as real
                      </button>
                      <button
                        className="danger-btn"
                        onClick={() => handleSaveCorrection("fake")}
                      >
                        Save as AI
                      </button>
                    </div>

                    {saveMessage && <p className="save-message">{saveMessage}</p>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ImageDetection;
