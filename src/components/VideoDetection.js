import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFramePrediction } from '../api/detectionApi';

const MAX_ANALYSIS_SECONDS = 5;
const FRAME_INTERVAL_SECONDS = 1;

const T = {
  aiSuspicious: "\u0041\u0049 \uc0dd\uc131 \uc758\uc2ec \ub3d9\uc601\uc0c1",
  likelyReal: "\uc2e4\uc81c \ub3d9\uc601\uc0c1 \uac00\ub2a5\uc131 \ub192\uc74c",
  aiVideo: "\u0041\u0049 \uc0dd\uc131 \ub3d9\uc601\uc0c1",
  realVideo: "\uc2e4\uc81c \ub3d9\uc601\uc0c1",
  seekFailed: "\ub3d9\uc601\uc0c1 \uc704\uce58\ub97c \uc774\ub3d9\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.",
  frameImageFailed: "\ud504\ub808\uc784 \uc774\ubbf8\uc9c0\ub97c \ub9cc\ub4e4 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.",
  metadataFailed: "\ub3d9\uc601\uc0c1 \uc815\ubcf4\ub97c \ubd88\ub7ec\uc62c \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.",
  frameDataFailed: "\ub3d9\uc601\uc0c1 \ud504\ub808\uc784\uc744 \ubd88\ub7ec\uc62c \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.",
  canvasFailed: "\ud504\ub808\uc784 \uce94\ubc84\uc2a4\ub97c \ub9cc\ub4e4 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.",
  extracting: "\ud504\ub808\uc784 \ucd94\ucd9c \uc911",
  videoOnly: "\ub3d9\uc601\uc0c1 \ud30c\uc77c\ub9cc \uc5c5\ub85c\ub4dc\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  preparing: "\ub3d9\uc601\uc0c1 \uc900\ube44 \uc911",
  loadingMetadata: "\ub3d9\uc601\uc0c1 \uc815\ubcf4\ub97c \ubd88\ub7ec\uc624\ub294 \uc911",
  analyzingFrames: "\ud504\ub808\uc784 \ubd84\uc11d \uc911",
  complete: "\uc644\ub8cc",
  framesAnalyzed: "\uac1c \ud504\ub808\uc784 \ubd84\uc11d \uc644\ub8cc",
  analysisFailed: "\ub3d9\uc601\uc0c1 \ud504\ub808\uc784 \ubd84\uc11d\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  selectVideo: "\ub3d9\uc601\uc0c1 \uc120\ud0dd",
  analyzing: "\ubd84\uc11d \uc911...",
  uploadAnalyze: "\uc5c5\ub85c\ub4dc \ud6c4 \ub3d9\uc601\uc0c1 \ubd84\uc11d",
  preview: "\ub3d9\uc601\uc0c1 \ubbf8\ub9ac\ubcf4\uae30",
  resultTitle: "\ub3d9\uc601\uc0c1 \ubd84\uc11d \uacb0\uacfc",
  error: "\uc624\ub958",
  suspiciousScore: "\uc758\uc2ec \uc810\uc218",
  detailedInfo: "\uc0c1\uc138 \uc815\ubcf4",
  close: "\ub2eb\uae30",
  analyzedFrames: "\ubd84\uc11d \ud504\ub808\uc784 \uc218",
  frameScores: "\ud504\ub808\uc784\ubcc4 \uc810\uc218",
};

function translateVideoLabel(label) {
  const labels = {
    "Suspicious AI-like Video": T.aiSuspicious,
    "Likely Real Video": T.likelyReal,
    "AI Generated Video": T.aiVideo,
    "Real Video": T.realVideo,
  };

  return labels[label] || label || "-";
}

function seekVideo(video, time) {
  return new Promise((resolve, reject) => {
    if (Math.abs(video.currentTime - time) < 0.01 && video.readyState >= 2) {
      requestAnimationFrame(resolve);
      return;
    }

    const handleSeeked = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error(T.seekFailed));
    };
    const cleanup = () => {
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };

    video.addEventListener('seeked', handleSeeked, { once: true });
    video.addEventListener('error', handleError, { once: true });
    video.currentTime = time;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error(T.frameImageFailed));
      }
    }, 'image/jpeg', 0.9);
  });
}

async function extractVideoFrames(file, onProgress) {
  const video = document.createElement('video');
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;
  video.muted = true;
  video.preload = 'metadata';

  try {
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = () => reject(new Error(T.metadataFailed));
    });

    if (!video.videoWidth || !video.videoHeight) {
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = () => reject(new Error(T.frameDataFailed));
      });
    }

    const duration = Math.min(video.duration || 0, MAX_ANALYSIS_SECONDS);
    const frameTimes = [];
    for (let time = 0; time < duration; time += FRAME_INTERVAL_SECONDS) {
      frameTimes.push(time);
    }
    if (frameTimes.length === 0) {
      frameTimes.push(0);
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error(T.canvasFailed);
    }
    const frames = [];

    for (let index = 0; index < frameTimes.length; index += 1) {
      const time = Math.min(frameTimes[index], Math.max(video.duration - 0.05, 0));
      onProgress({
        stage: T.extracting,
        detail: `${index + 1} / ${frameTimes.length}`,
        percent: Math.round(((index + 1) / frameTimes.length) * 40),
      });

      await seekVideo(video, time);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await canvasToBlob(canvas);
      frames.push(new File([blob], `frame_${index + 1}.jpg`, { type: 'image/jpeg' }));
    }

    return frames;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function VideoDetection() {
  const videoInputRef = useRef(null);
  const [videoResult, setVideoResult] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [videoFileName, setVideoFileName] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!videoUrl) return undefined;

    return () => URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  const selectVideoFile = useCallback((file) => {
    if (!file) return;

    if (file.type && !file.type.startsWith('video/')) {
      setVideoResult({ error: T.videoOnly });
      return;
    }

    setSelectedVideoFile(file);
    setVideoFileName(file.name || "uploaded-video");
    setVideoUrl(URL.createObjectURL(file));
    setVideoResult(null);
    setProgress(null);
    setDetailsOpen(false);
  }, []);

  const handleVideoFileChange = (event) => {
    selectVideoFile(event.target.files?.[0]);
  };

  const handleVideoUpload = async () => {
    if (!selectedVideoFile) return;

    setVideoLoading(true);
    setVideoResult(null);
    setDetailsOpen(false);
    setProgress({
      stage: T.preparing,
      detail: T.loadingMetadata,
      percent: 5,
    });

    try {
      const frames = await extractVideoFrames(selectedVideoFile, setProgress);
      const frameScores = [];

      for (let index = 0; index < frames.length; index += 1) {
        setProgress({
          stage: T.analyzingFrames,
          detail: `${index + 1} / ${frames.length}`,
          percent: 40 + Math.round(((index + 1) / frames.length) * 55),
        });

        const frameResult = await fetchFramePrediction(frames[index]);
        if (frameResult.error) {
          setVideoResult(frameResult);
          setVideoLoading(false);
          return;
        }
        frameScores.push(frameResult.suspicious_score);
      }

      const averageSuspiciousScore = frameScores.reduce((sum, value) => sum + value, 0) / frameScores.length;
      setVideoResult({
        label: averageSuspiciousScore >= 0.5 ? "Suspicious AI-like Video" : "Likely Real Video",
        suspicious_score: Number(averageSuspiciousScore.toFixed(4)),
        frame_count: frames.length,
        frame_predictions: frameScores.map((value) => Number(value.toFixed(4))),
      });
      setProgress({
        stage: T.complete,
        detail: `${frames.length}${T.framesAnalyzed}`,
        percent: 100,
      });
    } catch (error) {
      console.error('Error analyzing video frames:', error);
      setVideoResult({ error: T.analysisFailed });
      setProgress(null);
    } finally {
      setVideoLoading(false);
    }
  };

  const scorePercent = videoResult?.suspicious_score !== undefined
    ? Math.round(videoResult.suspicious_score * 100)
    : null;

  return (
    <>
      <div className="card video-card">
        <h2>Video Detection</h2>
        <label htmlFor="videoInput" className="file-label">
          {T.selectVideo}
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
          {videoLoading ? T.analyzing : T.uploadAnalyze}
        </button>

        {progress && (
          <div className="progress-box" role="status" aria-live="polite">
            <div className="progress-meta">
              <span>{progress.stage}</span>
              <strong>{progress.percent}%</strong>
            </div>
            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
            </div>
            <p>{progress.detail}</p>
          </div>
        )}
      </div>

      {(videoUrl || videoResult) && (
        <div className="content-grid">
          {videoUrl && (
            <div className="card preview-card">
              <h2>{T.preview}</h2>
              <video src={videoUrl} className="preview-video" controls />
            </div>
          )}

          {videoResult && (
            <div className="card result-card">
              <h2>{T.resultTitle}</h2>

              {videoResult.error ? (
                <p className="error-text">{T.error}: {videoResult.error}</p>
              ) : (
                <>
                  <div className="result-main">
                    <div className="result-badge">{translateVideoLabel(videoResult.label || videoResult.prediction)}</div>
                    <div className="score-panel">
                      <span>{T.suspiciousScore}</span>
                      <strong>{scorePercent !== null ? `${scorePercent}%` : "-"}</strong>
                    </div>
                  </div>

                  <button className="detail-btn" onClick={() => setDetailsOpen(true)}>
                    {T.detailedInfo}
                  </button>

                  {detailsOpen && (
                    <div className="modal-backdrop" role="presentation" onClick={() => setDetailsOpen(false)}>
                      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="video-details-title" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                          <h3 id="video-details-title">{T.detailedInfo}</h3>
                          <button className="modal-close" onClick={() => setDetailsOpen(false)} aria-label={T.close}>x</button>
                        </div>

                        <div className="info-box modal-info">
                          <p><span>{T.analyzedFrames}</span><strong>{videoResult.frame_count ?? videoResult.frame_predictions?.length ?? "-"}</strong></p>
                          <p><span>{T.frameScores}</span><strong>{videoResult.frame_predictions?.join(", ") || "-"}</strong></p>
                          <p><span>{T.suspiciousScore}</span><strong>{videoResult.suspicious_score ?? "-"}</strong></p>
                        </div>
                      </div>
                    </div>
                  )}
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
