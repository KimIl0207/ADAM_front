import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || "http://localhost:8000";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE = 100 * 1024 * 1024;

async function fetchPrediction(file) {
  const imageData = new FormData();
  imageData.append('file', file);

  if (file.size > MAX_FILE_SIZE) {
    return { error: "File size exceeds 10MB." };
  }

  if (file.type && !file.type.startsWith('image/')) {
    return { error: "Invalid file type. Please upload an image." };
  }

  try {
    const response = await fetch(`${IMAGE_BASE_URL}/predict`, {
      method: 'POST',
      body: imageData,
    });

    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    return { error: "Server request failed." };
  }
}

async function fetchVideoPrediction(file) {
  const videoData = new FormData();
  videoData.append('file', file);

  if (file.size > MAX_VIDEO_FILE_SIZE) {
    return { error: "Video file size exceeds 100MB." };
  }

  if (file.type && !file.type.startsWith('video/')) {
    return { error: "Invalid file type. Please upload a video." };
  }

  try {
    const response = await fetch(`${IMAGE_BASE_URL}/predict-video`, {
      method: 'POST',
      body: videoData,
    });

    return await response.json();
  } catch (error) {
    console.error('Error uploading video:', error);
    return { error: "Video server request failed." };
  }
}

async function saveCorrection(file, correctLabel, prediction) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('correct_label', correctLabel);

  const appendIfPresent = (key, value) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  };

  appendIfPresent('predicted_label', prediction?.label);
  appendIfPresent('predicted_probability', prediction?.probability);
  appendIfPresent('selected_generator_model', prediction?.generator_model);
  appendIfPresent('sd_prob', prediction?.probs?.sd);
  appendIfPresent('mj_prob', prediction?.probs?.mj);
  appendIfPresent('bg_prob', prediction?.probs?.bg);

  try {
    const response = await fetch(`${IMAGE_BASE_URL}/save-correction`, {
      method: 'POST',
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.error('Error saving correction:', error);
    return null;
  }
}

async function fetchTextDetection(text) {
  if (text.trim().length < 10) {
    return { error: "Text must be at least 10 characters." };
  }

  try {
    const response = await fetch(`${IMAGE_BASE_URL}/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error detecting text:', error);
    return { error: "Text server request failed." };
  }
}

function App() {
  console.log("API Base URL:", IMAGE_BASE_URL);
  const fileInputRef = useRef(null);
  const [result, setResult] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textResult, setTextResult] = useState(null);
  const [textLoading, setTextLoading] = useState(false);
  const videoInputRef = useRef(null);
  const [videoResult, setVideoResult] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [videoFileName, setVideoFileName] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) return undefined;

    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    if (!videoUrl) return undefined;

    return () => URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

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

  const selectVideoFile = useCallback((file) => {
    if (!file) return;

    if (file.type && !file.type.startsWith('video/')) {
      setVideoResult({ error: "Invalid file type. Please upload a video." });
      return;
    }

    setSelectedVideoFile(file);
    setVideoFileName(file.name || "uploaded-video");
    setVideoUrl(URL.createObjectURL(file));
    setVideoResult(null);
  }, []);

  const handleVideoFileChange = (event) => {
    selectVideoFile(event.target.files?.[0]);
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

  const handleVideoUpload = async () => {
    if (!selectedVideoFile) return;

    setVideoLoading(true);
    setVideoResult(null);

    const data = await fetchVideoPrediction(selectedVideoFile);
    setVideoResult(data);
    setVideoLoading(false);
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

  const handleTextDetection = async () => {
    setTextLoading(true);
    setTextResult(null);

    const data = await fetchTextDetection(textInput);
    setTextResult(data);
    setTextLoading(false);
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">AI Detector</h1>
        <p className="subtitle">Test images and text against the current AI detection servers.</p>

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
                        Probability: <strong>{result.probability}</strong>
                      </div>
                    </div>

                    <div className="info-box">
                      <p><span>Predicted Model</span><strong>{result.generator_model || "-"}</strong></p>
                      <p><span>SD</span><strong>{result.probs?.sd ?? "-"}</strong></p>
                      <p><span>MJ</span><strong>{result.probs?.mj ?? "-"}</strong></p>
                      <p><span>BG</span><strong>{result.probs?.bg ?? "-"}</strong></p>
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

        <div className="card video-card">
          <h2>Video Detection</h2>
          <label htmlFor="videoInput" className="file-label">
            Select video
          </label>
          <input
            ref={videoInputRef}
            type="file"
            id="videoInput"
            accept="video/*"
            className="file-input"
            onChange={handleVideoFileChange}
          />
          {videoFileName && <p className="file-name">{videoFileName}</p>}

          <button className="primary-btn" onClick={handleVideoUpload} disabled={videoLoading || !selectedVideoFile}>
            {videoLoading ? "Analyzing..." : "Upload and analyze video"}
          </button>
        </div>

        {(videoUrl || videoResult) && (
          <div className="content-grid">
            {videoUrl && (
              <div className="card preview-card">
                <h2>Video Preview</h2>
                <video src={videoUrl} className="preview-video" controls />
              </div>
            )}

            {videoResult && (
              <div className="card result-card">
                <h2>Video Result</h2>

                {videoResult.error ? (
                  <p className="error-text">Error: {videoResult.error}</p>
                ) : (
                  <>
                    <div className="result-main">
                      <div className="result-badge">{videoResult.label || videoResult.prediction}</div>
                      <div className="result-prob">
                        Probability: <strong>{videoResult.probability ?? "-"}</strong>
                      </div>
                    </div>

                    <div className="info-box">
                      <p><span>Analyzed Frames</span><strong>{videoResult.frame_count ?? videoResult.frame_predictions?.length ?? "-"}</strong></p>
                      <p><span>Frame Probabilities</span><strong>{videoResult.frame_predictions?.join(", ") || "-"}</strong></p>
                      <p><span>Probability</span><strong>{videoResult.probability ?? "-"}</strong></p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="card text-card">
          <h2>Text Detection</h2>
          <textarea
            className="text-input"
            value={textInput}
            onChange={(event) => setTextInput(event.target.value)}
            placeholder="Enter text to analyze"
            rows={8}
          />
          <button className="primary-btn" onClick={handleTextDetection} disabled={textLoading}>
            {textLoading ? "Analyzing..." : "Analyze text"}
          </button>

          {textResult && (
            <div className="text-result">
              {textResult.error ? (
                <p className="error-text">Error: {textResult.error}</p>
              ) : (
                <div className="info-box">
                  <p><span>Label: </span><strong>{textResult.final_ai_prob ? "AI" : "Human"}</strong></p>
                  <p><span>Final AI Probability</span><strong>{textResult.final_ai_prob?.toFixed?.(1) ?? "-"}%</strong></p>
                  <p><span>RoBERTa AI Probability</span><strong>{textResult.roberta_ai_prob?.toFixed?.(1) ?? "-"}%</strong></p>
                  <p><span>Language</span><strong>{textResult.language || "-"}</strong></p>
                  <p><span>Burstiness</span><strong>{textResult.burstiness?.toFixed?.(2) ?? "-"}</strong></p>
                  <p><span>KO Perplexity</span><strong>{textResult.ko_perplexity?.toFixed?.(2) ?? "-"}</strong></p>
                  <p><span>EN Perplexity</span><strong>{textResult.en_perplexity?.toFixed?.(2) ?? "-"}</strong></p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
