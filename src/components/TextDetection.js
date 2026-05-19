import { useState } from 'react';
import { fetchTextDetection } from '../api/detectionApi';

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
        placeholder="Enter text to analyze"
        rows={8}
      />
      <button className="primary-btn" onClick={handleTextDetection} disabled={textLoading}>
        {textLoading ? "Analyzing..." : "Analyze text"}
      </button>

      {textResult && (
        <div className="text-result">
          {textResult.error ? (
            <p className="error-text">Error: {textResult.error}</p>
          ) : (
            <div className="info-box">
              <p><span>Label: </span><strong>{textResult.final_ai_prob ? "AI" : "Human"}</strong></p>
              <p><span>Final AI Probability</span><strong>{textResult.final_ai_prob?.toFixed?.(1) ?? "-"}%</strong></p>
              <p><span>RoBERTa AI Probability</span><strong>{textResult.roberta_ai_prob?.toFixed?.(1) ?? "-"}%</strong></p>
              <p><span>Language</span><strong>{textResult.language || "-"}</strong></p>
              <p><span>Burstiness</span><strong>{textResult.burstiness?.toFixed?.(2) ?? "-"}</strong></p>
              <p><span>KO Perplexity</span><strong>{textResult.ko_perplexity?.toFixed?.(2) ?? "-"}</strong></p>
              <p><span>EN Perplexity</span><strong>{textResult.en_perplexity?.toFixed?.(2) ?? "-"}</strong></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TextDetection;
