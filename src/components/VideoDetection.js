import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchVideoPrediction } from '../api/detectionApi';

function VideoDetection() {
  const videoInputRef = useRef(null);
  const [videoResult, setVideoResult] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [videoFileName, setVideoFileName] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);

  useEffect(() => {
    if (!videoUrl) return undefined;

    return () => URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

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

  const handleVideoUpload = async () => {
    if (!selectedVideoFile) return;

    setVideoLoading(true);
    setVideoResult(null);

    const data = await fetchVideoPrediction(selectedVideoFile);
    setVideoResult(data);
    setVideoLoading(false);
  };

  return (
    <>
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
    </>
  );
}

export default VideoDetection;
