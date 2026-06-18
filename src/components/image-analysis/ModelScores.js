import { getModelLabel, MODEL_DESCRIPTIONS, toPercent } from "./analysisHelpers";
import LoadingSkeleton from "./LoadingSkeleton";

function ModelScores({ loading, modelProbs }) {
  const entries = Object.entries(modelProbs || {});

  return (
    <section className="image-card model-score-card" aria-labelledby="model-score-title">
      <div className="image-card-header">
        <span className="image-kicker">Models</span>
        <h2 id="model-score-title">모델별 점수</h2>
        <p>각 판별 모델의 AI 의심 반응을 비교합니다.</p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : entries.length ? (
        <div className="model-score-list">
          {entries.map(([modelKey, score]) => {
            const percent = toPercent(score);
            return (
              <div className="model-score-item" key={modelKey}>
                <div className="model-score-meta">
                  <div>
                    <strong>{getModelLabel(modelKey)}</strong>
                    <span className="tooltip-chip" title={MODEL_DESCRIPTIONS[modelKey] || "Detector model response."}>
                      설명
                    </span>
                  </div>
                  <span>{percent}%</span>
                </div>
                <div className="image-progress-track">
                  <span style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="image-muted-box">분석 후 모델별 점수가 표시됩니다.</p>
      )}
    </section>
  );
}

export default ModelScores;
