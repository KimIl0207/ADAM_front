import { getDecisionSummary, toPercent } from "./analysisHelpers";
import LoadingSkeleton from "./LoadingSkeleton";

function ResultSummary({ gradCamUrl, loading, result, scorePercent, translateConfidence, translateImageLabel }) {
  const decision = getDecisionSummary(result?.suspicious_score);

  return (
    <section className="image-card result-summary-card" aria-labelledby="image-result-title">
      <div className="image-card-header">
        <span className="image-kicker">Output</span>
        <h2 id="image-result-title">분석 결과</h2>
        <p>종합 점수, 판정, 신뢰도를 한눈에 확인합니다.</p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : result?.error ? (
        <div className="image-error-box">오류: {result.error}</div>
      ) : (
        <>
          <div className="score-ring-row">
            <div className="score-ring" style={{ "--score": `${scorePercent || 0}%` }}>
              <strong>{scorePercent !== null ? `${scorePercent}%` : "-"}</strong>
              <span>AI 가능성</span>
            </div>

            <div className="decision-stack">
              <span className={`decision-badge tone-${decision.tone}`}>
                {result ? decision.title : "분석 대기"}
              </span>
              <h3>{result ? translateImageLabel(result.label) : "이미지를 업로드하세요"}</h3>
              <p>{result ? decision.description : "업로드 후 모델별 점수와 Grad-CAM 설명이 표시됩니다."}</p>
              <div className="confidence-pill">
                <span>신뢰도</span>
                <strong>{result ? translateConfidence(result.confidence) : "-"}</strong>
              </div>
            </div>
          </div>

          <div className={`gradcam-panel ${gradCamUrl ? "has-preview" : ""}`}>
            {gradCamUrl ? (
              <img src={gradCamUrl} alt="Grad-CAM heatmap" className="image-preview-media" />
            ) : (
              <div>
                <strong>Grad-CAM</strong>
                <span>분석 완료 후 heatmap이 표시됩니다.</span>
              </div>
            )}
          </div>

          {result?.signals?.model_fusion !== undefined && (
            <div className="fusion-bar">
              <div className="fusion-bar-meta">
                <span>모델 합성 점수</span>
                <strong>{toPercent(result.signals.model_fusion)}%</strong>
              </div>
              <div className="image-progress-track">
                <span style={{ width: `${toPercent(result.signals.model_fusion)}%` }} />
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default ResultSummary;
