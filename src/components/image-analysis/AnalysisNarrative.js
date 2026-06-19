import { getAnalysisNarrative } from "./analysisHelpers";

function AnalysisNarrative({ result }) {
  return (
    <section className="image-card narrative-card" aria-labelledby="analysis-narrative-title">
      <div className="image-card-header">
        <span className="image-kicker">Explain</span>
        <h2 id="analysis-narrative-title">분석 설명</h2>
      </div>
      <p>{getAnalysisNarrative(result)}</p>
    </section>
  );
}

export default AnalysisNarrative;
