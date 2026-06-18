import { getModelLabel, MODEL_DESCRIPTIONS, toPercent } from "./analysisHelpers";
import LoadingSkeleton from "./LoadingSkeleton";

function ModelScores({ fusionModelScores, loading, modelProbs }) {
  const entries = Object.entries(modelProbs || {});
  const fusionEntries = Object.entries(fusionModelScores || {});

  return (
    <section className="image-card model-score-card" aria-labelledby="model-score-title">
      <div className="image-card-header">
        <span className="image-kicker">Models</span>
        <h2 id="model-score-title">모델별 점수</h2>
        <p>원본 모델 반응과 최종 판정에 반영된 보정 점수를 함께 확인합니다.</p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : entries.length ? (
        <>
          {fusionEntries.length > 0 && (
            <div className="model-score-group">
              <h3>판정 반영 점수</h3>
              <div className="model-score-list">
                {fusionEntries.map(([modelKey, score]) => {
                  const percent = toPercent(score);
                  return (
                    <div className="model-score-item is-fusion" key={`fusion-${modelKey}`}>
                      <div className="model-score-meta">
                        <div>
                          <strong>{getModelLabel(modelKey)}</strong>
                          <span className="tooltip-chip" title="모델별 임계값 보정 후 최종 판정에 반영되는 점수입니다.">
                            반영
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
            </div>
          )}

          <div className="model-score-group">
            <h3>원본 모델 점수</h3>
            <div className="model-score-list">
              {entries.map(([modelKey, score]) => {
                const percent = toPercent(score);
                const isFusionModel = Object.prototype.hasOwnProperty.call(fusionModelScores || {}, modelKey);
                return (
                  <div className="model-score-item" key={modelKey}>
                    <div className="model-score-meta">
                      <div>
                        <strong>{getModelLabel(modelKey)}</strong>
                        <span className="tooltip-chip" title={MODEL_DESCRIPTIONS[modelKey] || "Detector model response."}>
                          설명
                        </span>
                        {isFusionModel && (
                          <span className="tooltip-chip" title="현재 최종 판정에 사용되는 모델입니다.">
                            사용
                          </span>
                        )}
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
          </div>
        </>
      ) : (
        <p className="image-muted-box">분석 후 모델별 점수가 표시됩니다.</p>
      )}
    </section>
  );
}

export default ModelScores;
