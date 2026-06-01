import { useState } from 'react';
import { fetchTextDetection } from '../api/detectionApi';

const T = {
  placeholder: "\ud14d\uc2a4\ud2b8\ub97c \uc785\ub825\ud574 \ubd84\uc11d\ud558\uc138\uc694",
  analyzing: "\ubd84\uc11d \uc911...",
  analyzeText: "\ud14d\uc2a4\ud2b8 \ubd84\uc11d",
  error: "\uc624\ub958",
  ai: "\u0041\u0049",
  human: "\uc0ac\ub78c",
  uncertain: "\ubd88\ud655\uc2e4",
  label: "\ub77c\ubca8",
  detailedInfo: "\uc0c1\uc138 \uc815\ubcf4",
  close: "\ub2eb\uae30",
  finalAiProb: "\ucd5c\uc885 \u0041\u0049 \ud655\ub960",
  robertaAiProb: "RoBERTa \u0041\u0049 \ud655\ub960",
  language: "\uc5b8\uc5b4",
  burstiness: "\ubb38\uc7a5 \ubcc0\ub3d9\uc131",
  koPerplexity: "\ud55c\uad6d\uc5b4 Perplexity",
  enPerplexity: "\uc601\uc5b4 Perplexity",
  suspiciousParts: "\u0041\u0049\ub85c \uc778\uc2dd\ub41c \ubb38\uc7a5",
  highlightedText: "\ud558\uc774\ub77c\uc774\ud2b8 \uacb0\uacfc",
  noSuspiciousParts: "\ud2b9\ud788 \u0041\u0049\ub85c \uac15\ud558\uac8c \uc778\uc2dd\ub41c \ubb38\uc7a5\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
  aiLike: "\uc758\uc2ec",
  humanLike: "\ub0ae\uc74c",
};

function getHighlightClass(aiProb = 0) {
  if (aiProb >= 80) return "highlight-high";
  if (aiProb >= 60) return "highlight-mid";
  return "highlight-low";
}

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
  const sentenceHighlights = textResult?.sentence_highlights || [];
  const suspiciousHighlights = sentenceHighlights.filter((item) => item.is_ai_like);
  const orderedHighlights = sentenceHighlights
    .filter((item) => item.is_ai_like)
    .sort((a, b) => a.start - b.start);
  const resultLabel = textResult?.decision === "AI"
    ? T.ai
    : textResult?.decision === "Human"
      ? T.human
      : T.uncertain;
  const renderHighlightedText = () => {
    if (!textInput.trim()) {
      return <span className="muted-text">{T.placeholder}</span>;
    }

    if (!orderedHighlights.length) {
      return textInput;
    }

    const nodes = [];
    let cursor = 0;

    orderedHighlights.forEach((item) => {
      const start = Math.max(item.start, cursor);
      const end = Math.max(item.end, start);

      if (start > cursor) {
        nodes.push(textInput.slice(cursor, start));
      }

      nodes.push(
        <mark className={getHighlightClass(item.ai_prob)} key={`${item.start}-${item.end}`}>
          {textInput.slice(start, end)}
        </mark>
      );

      cursor = end;
    });

    if (cursor < textInput.length) {
      nodes.push(textInput.slice(cursor));
    }

    return nodes;
  };

  return (
    <div className="text-page-layout">
      <div className="card text-card detector-card text-upload-card">
        <div className="panel-heading">
          <span className="eyebrow">원본 텍스트</span>
          <h2>Text Detection</h2>
        </div>

        <textarea
          className="text-input"
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
          placeholder={T.placeholder}
          rows={12}
        />
        <button className="primary-btn" onClick={handleTextDetection} disabled={textLoading}>
          {textLoading ? T.analyzing : T.analyzeText}
        </button>
      </div>

      <div className="card text-card result-panel">
        <div className="panel-heading">
          <span className="eyebrow">{T.highlightedText}</span>
          <h2>{T.suspiciousParts}</h2>
        </div>

        <div className="highlighted-text-box">
          {renderHighlightedText()}
        </div>

        {textResult && (
          <div className="text-result">
            {textResult.error ? (
              <p className="error-text">{T.error}: {textResult.error}</p>
            ) : (
              <>
                <div className="result-main">
                  <div className="result-badge">{resultLabel}</div>
                  <div className="score-panel">
                    <span>{T.finalAiProb}</span>
                    <strong>{finalAiProb !== undefined ? `${finalAiProb}%` : "-"}</strong>
                  </div>
                </div>

                <button className="detail-btn" onClick={() => setDetailsOpen(true)}>
                  {T.detailedInfo}
                </button>

                {suspiciousHighlights.length === 0 && (
                  <p className="highlight-empty">{T.noSuspiciousParts}</p>
                )}

                {detailsOpen && (
                  <div className="modal-backdrop" role="presentation" onClick={() => setDetailsOpen(false)}>
                    <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="text-details-title" onClick={(event) => event.stopPropagation()}>
                      <div className="modal-header">
                        <h3 id="text-details-title">{T.detailedInfo}</h3>
                        <button className="modal-close" onClick={() => setDetailsOpen(false)} aria-label={T.close}>x</button>
                      </div>

                      <div className="info-box modal-info">
                        <p><span>{T.label}</span><strong>{resultLabel}</strong></p>
                        <p><span>{T.finalAiProb}</span><strong>{finalAiProb ?? "-"}%</strong></p>
                        <p><span>{T.robertaAiProb}</span><strong>{textResult.roberta_ai_prob?.toFixed?.(1) ?? "-"}%</strong></p>
                        <p><span>{T.language}</span><strong>{textResult.language || "-"}</strong></p>
                        <p><span>{T.burstiness}</span><strong>{textResult.burstiness?.toFixed?.(2) ?? "-"}</strong></p>
                        <p><span>{T.koPerplexity}</span><strong>{textResult.ko_perplexity?.toFixed?.(2) ?? "-"}</strong></p>
                        <p><span>{T.enPerplexity}</span><strong>{textResult.en_perplexity?.toFixed?.(2) ?? "-"}</strong></p>
                      </div>

                      {sentenceHighlights.length > 0 && (
                        <div className="highlight-panel modal-highlight-panel">
                          <h3>{T.suspiciousParts}</h3>
                          <div className="highlight-list">
                            {sentenceHighlights.map((item) => (
                              <article className={`highlight-item ${item.is_ai_like ? "is-ai-like" : "is-human-like"}`} key={`detail-${item.start}-${item.end}`}>
                                <p>{item.text}</p>
                                <div className="highlight-meta">
                                  <span>{item.is_ai_like ? T.aiLike : T.humanLike} {item.ai_prob?.toFixed?.(1) ?? item.ai_prob}%</span>
                                  <span>RoBERTa {item.roberta_ai_prob?.toFixed?.(1) ?? item.roberta_ai_prob}%</span>
                                  <span>PPL {item.perplexity?.toFixed?.(2) ?? "-"}</span>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TextDetection;
