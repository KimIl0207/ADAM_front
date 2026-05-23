import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFramePrediction } from '../api/detectionApi';

const MAX_ANALYSIS_SECONDS = 5;
const FRAME_INTERVAL_SECONDS = 1;

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
      reject(new Error("Could not seek video."));
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
        reject(new Error("Could not create frame image."));
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
      video.onerror = () => reject(new Error("Could not load video metadata."));
    });

    if (!video.videoWidth || !video.videoHeight) {
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = () => reject(new Error("Could not load video frame data."));
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
      throw new Error("Could not create frame canvas.");
    }
    const frames = [];

    for (let index = 0; index < frameTimes.length; index += 1) {
      const time = Math.min(frameTimes[index], Math.max(video.duration - 0.05, 0));
      onProgress({
        stage: "Extracting frames",
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
    setProgress(null);
  }, []);

  const handleVideoFileChange = (event) => {
    selectVideoFile(event.target.files?.[0]);
  };

  const handleVideoUpload = async () => {
    if (!selectedVideoFile) return;

    setVideoLoading(true);
    setVideoResult(null);
    setProgress({
      stage: "Preparing video",
      detail: "Loading metadata",
      percent: 5,
    });

    try {
      const frames = await extractVideoFrames(selectedVideoFile, setProgress);
      const frameScores = [];

      for (let index = 0; index < frames.length; index += 1) {
        setProgress({
          stage: "Analyzing frames",
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
        stage: "Complete",
        detail: `${frames.length} frames analyzed`,
        percent: 100,
      });
    } catch (error) {
      console.error('Error analyzing video frames:', error);
      setVideoResult({ error: "Video frame analysis failed." });
      setProgress(null);
    } finally {
      setVideoLoading(false);
    }
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
                      Suspicious Score: <strong>{videoResult.suspicious_score ?? "-"}</strong>
                    </div>
                  </div>

                  <div className="info-box">
                    <p><span>Analyzed Frames</span><strong>{videoResult.frame_count ?? videoResult.frame_predictions?.length ?? "-"}</strong></p>
                    <p><span>Frame Scores</span><strong>{videoResult.frame_predictions?.join(", ") || "-"}</strong></p>
                    <p><span>Suspicious Score</span><strong>{videoResult.suspicious_score ?? "-"}</strong></p>
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
