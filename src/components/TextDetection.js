import { useState } from 'react';
import { fetchTextDetection } from '../api/detectionApi';

const T = {
  placeholder: "\ud14d\uc2a4\ud2b8\ub97c \uc785\ub825\ud574 \ubd84\uc11d\ud558\uc138\uc694",
  analyzing: "\ubd84\uc11d \uc911...",
  analyzeText: "\ud14d\uc2a4\ud2b8 \ubd84\uc11d",
  error: "\uc624\ub958",
  ai: "\u0041\u0049",
  human: "\uc0ac\ub78c",
  label: "\ub77c\ubca8",
  detailedInfo: "\uc0c1\uc138 \uc815\ubcf4",
  close: "\ub2eb\uae30",
  finalAiProb: "\ucd5c\uc885 \u0041\u0049 \ud655\ub960",
  robertaAiProb: "RoBERTa \u0041\u0049 \ud655\ub960",
  language: "\uc5b8\uc5b4",
  burstiness: "\ubb38\uc7a5 \ubcc0\ub3d9\uc131",
  koPerplexity: "\ud55c\uad6d\uc5b4 Perplexity",
  enPerplexity: "\uc601\uc5b4 Perplexity",
};

function TextDetection() {
  const [textInput, setTextInput] = useState("");
  const [textResult, setTextResult] = useState(null);
  const [textLoading, setTextLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleTextDetection = async () => {
    setTextLoading(true);
    setTextResult(null);
    setDetailsOpen(false);

    const data = await fetchTextDetection(textInput);
    setTextResult(data);
    setTextLoading(false);
  };

  const finalAiProb = textResult?.final_ai_prob?.toFixed?.(1);

  return (
    <div className="card text-card">
      <h2>Text Detection</h2>
      <textarea
        className="text-input"
        value={textInput}
        onChange={(event) => setTextInput(event.target.value)}
        placeholder={T.placeholder}
        rows={8}
      />
      <button className="primary-btn" onClick={handleTextDetection} disabled={textLoading}>
        {textLoading ? T.analyzing : T.analyzeText}
      </button>

      {textResult && (
        <div className="text-result">
          {textResult.error ? (
            <p className="error-text">{T.error}: {textResult.error}</p>
          ) : (
            <>
              <div className="result-main">
                <div className="result-badge">{textResult.final_ai_prob ? T.ai : T.human}</div>
                <div className="score-panel">
                  <span>{T.finalAiProb}</span>
                  <strong>{finalAiProb !== undefined ? `${finalAiProb}%` : "-"}</strong>
                </div>
              </div>

              <button className="detail-btn" onClick={() => setDetailsOpen(true)}>
                {T.detailedInfo}
              </button>

              {detailsOpen && (
                <div className="modal-backdrop" role="presentation" onClick={() => setDetailsOpen(false)}>
                  <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="text-details-title" onClick={(event) => event.stopPropagation()}>
                    <div className="modal-header">
                      <h3 id="text-details-title">{T.detailedInfo}</h3>
                      <button className="modal-close" onClick={() => setDetailsOpen(false)} aria-label={T.close}>x</button>
                    </div>

                    <div className="info-box modal-info">
                      <p><span>{T.label}</span><strong>{textResult.final_ai_prob ? T.ai : T.human}</strong></p>
                      <p><span>{T.finalAiProb}</span><strong>{finalAiProb ?? "-"}%</strong></p>
                      <p><span>{T.robertaAiProb}</span><strong>{textResult.roberta_ai_prob?.toFixed?.(1) ?? "-"}%</strong></p>
                      <p><span>{T.language}</span><strong>{textResult.language || "-"}</strong></p>
                      <p><span>{T.burstiness}</span><strong>{textResult.burstiness?.toFixed?.(2) ?? "-"}</strong></p>
                      <p><span>{T.koPerplexity}</span><strong>{textResult.ko_perplexity?.toFixed?.(2) ?? "-"}</strong></p>
                      <p><span>{T.enPerplexity}</span><strong>{textResult.en_perplexity?.toFixed?.(2) ?? "-"}</strong></p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TextDetection;
