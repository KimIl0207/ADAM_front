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

  const handleTextDetection = async () => {
    setTextLoading(true);
    setTextResult(null);

    const data = await fetchTextDetection(textInput);
    setTextResult(data);
    setTextLoading(false);
  };

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
            <div className="info-box">
              <p><span>{T.label}: </span><strong>{textResult.final_ai_prob ? T.ai : T.human}</strong></p>
              <p><span>{T.finalAiProb}</span><strong>{textResult.final_ai_prob?.toFixed?.(1) ?? "-"}%</strong></p>
              <p><span>{T.robertaAiProb}</span><strong>{textResult.roberta_ai_prob?.toFixed?.(1) ?? "-"}%</strong></p>
              <p><span>{T.language}</span><strong>{textResult.language || "-"}</strong></p>
              <p><span>{T.burstiness}</span><strong>{textResult.burstiness?.toFixed?.(2) ?? "-"}</strong></p>
              <p><span>{T.koPerplexity}</span><strong>{textResult.ko_perplexity?.toFixed?.(2) ?? "-"}</strong></p>
              <p><span>{T.enPerplexity}</span><strong>{textResult.en_perplexity?.toFixed?.(2) ?? "-"}</strong></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TextDetection;
