export const IMAGE_DECISION_THRESHOLDS = {
  aiLikely: 0.75,
  uncertain: 0.45,
};

export const MODEL_DESCRIPTIONS = {
  sd: "Stable Diffusion detector response.",
  mj: "Midjourney detector response.",
  mj6: "Midjourney v6 detector response.",
  bg: "BigGAN detector response.",
  sd3: "Stable Diffusion 3 detector response.",
  sdxl: "SDXL detector response.",
  dalle3: "DALL-E 3 detector response.",
  univfd: "Universal fake-image feature detector response.",
};

export function clampScore(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return 0;
  return Math.max(0, Math.min(1, numericScore));
}

export function toPercent(score) {
  return Math.round(clampScore(score) * 100);
}

export function getDecisionSummary(score) {
  const normalizedScore = clampScore(score);

  if (normalizedScore >= IMAGE_DECISION_THRESHOLDS.aiLikely) {
    return {
      tone: "danger",
      title: "AI 생성 가능성 높음",
      description: "여러 모델 신호가 AI 생성 이미지 쪽으로 강하게 기울었습니다.",
    };
  }

  if (normalizedScore >= IMAGE_DECISION_THRESHOLDS.uncertain) {
    return {
      tone: "warning",
      title: "판단 불확실",
      description: "AI와 실사 신호가 함께 관측되어 추가 검토가 필요합니다.",
    };
  }

  return {
    tone: "success",
    title: "실사 가능성 높음",
    description: "현재 모델 기준으로는 실사 이미지 신호가 더 우세합니다.",
  };
}

export function getModelLabel(modelKey) {
  const labels = {
    sd: "SD",
    mj: "MJ",
    mj6: "MJ v6",
    bg: "BigGAN",
    sd3: "SD3",
    sdxl: "SDXL",
    dalle3: "DALL-E 3",
    univfd: "UnivFD",
  };

  return labels[modelKey] || modelKey;
}

export function getAnalysisNarrative(result) {
  if (!result) {
    return "이미지를 업로드하면 모델별 반응과 종합 점수를 바탕으로 분석 설명이 생성됩니다.";
  }

  if (result.error) {
    return "분석 요청을 완료하지 못했습니다. 이미지 형식, 파일 크기, 서버 연결 상태를 확인하세요.";
  }

  const score = clampScore(result.suspicious_score);
  const decision = getDecisionSummary(score);
  const modelEntries = Object.entries(result.signals?.fusion_model_scores || result.model_probs || {});
  const strongestModel = modelEntries.reduce(
    (best, current) => (Number(current[1]) > Number(best?.[1] ?? -1) ? current : best),
    null
  );
  const modelText = strongestModel
    ? `${getModelLabel(strongestModel[0])} 모델이 ${toPercent(strongestModel[1])}%로 가장 강하게 반응했습니다.`
    : "모델별 세부 점수는 응답에 포함되지 않았습니다.";

  return `${decision.title}. 종합 AI 가능성 점수는 ${toPercent(score)}%입니다. ${modelText} ${decision.description}`;
}

export function formatFileSize(size) {
  if (!size) return "-";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
