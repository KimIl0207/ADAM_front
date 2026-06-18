function AnalysisHistory({ fileName, result, saveMessage, onSaveCorrection }) {
  return (
    <section className="image-card history-card" aria-labelledby="analysis-history-title">
      <div className="image-card-header">
        <span className="image-kicker">Review</span>
        <h2 id="analysis-history-title">주의사항 및 피드백</h2>
      </div>

      <div className="history-list">
        <div>
          <span>최근 분석</span>
          <strong>{fileName || "아직 없음"}</strong>
        </div>
        <div>
          <span>판정 기준</span>
          <strong>AI 75% 이상 / 불확실 45~75% / 실사 45% 미만</strong>
        </div>
        <div>
          <span>주의</span>
          <strong>압축, 리사이즈, 보정이 강한 이미지는 점수가 흔들릴 수 있습니다.</strong>
        </div>
      </div>

      <div className="correction-actions">
        <p>예측이 틀렸다면 정답을 저장해 개선 데이터로 남기세요.</p>
        <div className="button-row">
          <button className="image-secondary-btn" onClick={() => onSaveCorrection("real")} disabled={!result}>
            실제 이미지로 저장
          </button>
          <button className="image-danger-btn" onClick={() => onSaveCorrection("fake")} disabled={!result}>
            AI 이미지로 저장
          </button>
        </div>
        {saveMessage && <p className="save-message">{saveMessage}</p>}
      </div>
    </section>
  );
}

export default AnalysisHistory;
