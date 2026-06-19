import { toPercent } from "./analysisHelpers";
import LoadingSkeleton from "./LoadingSkeleton";

const STAGE_LABELS = {
  diffuse: "전체 반응",
  localized: "국소 반응",
  person_regions: "사람 영역 분석",
  empty: "범위 판단 어려움",
};

const REGION_LABELS = {
  face: "얼굴 영역",
  body: "몸/인물 영역",
  background: "배경 영역",
  other: "기타 영역",
  localized: "국소 영역",
};

function getStageLabel(stage) {
  return STAGE_LABELS[stage] || stage || "-";
}

function getRegionLabel(regionKey) {
  return REGION_LABELS[regionKey] || regionKey;
}

function FocusAnalysis({ focus, loading }) {
  const regionEntries = Object.entries(focus?.region_scores || {});

  return (
    <section className="image-card focus-analysis-card" aria-labelledby="focus-analysis-title">
      <div className="image-card-header">
        <span className="image-kicker">Focus</span>
        <h2 id="focus-analysis-title">AI 반응 범위</h2>
        <p>Grad-CAM 반응이 전체에 퍼졌는지, 특정 사람/영역에 집중됐는지 확인합니다.</p>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : focus ? (
        <>
          <div className="image-muted-box">
            <strong>{getStageLabel(focus.stage)}</strong>
            <span>{focus.interpretation || "-"}</span>
          </div>

          <div className="model-score-list">
            {regionEntries.length ? (
              regionEntries.map(([regionKey, ratio]) => {
                const percent = toPercent(ratio);
                return (
                  <div className="model-score-item" key={regionKey}>
                    <div className="model-score-meta">
                      <strong>{getRegionLabel(regionKey)}</strong>
                      <span>{percent}%</span>
                    </div>
                    <div className="image-progress-track">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="image-muted-box">추가 객체 분리 없이 전체 반응으로 해석했습니다.</p>
            )}
          </div>
        </>
      ) : (
        <p className="image-muted-box">분석 후 Grad-CAM 반응 범위가 표시됩니다.</p>
      )}
    </section>
  );
}

export default FocusAnalysis;
