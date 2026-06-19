const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || "http://localhost:8000";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ERROR_MESSAGES = {
  imageSize: "\ud30c\uc77c \ud06c\uae30\ub294 10MB\ub97c \ub118\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.",
  imageType: "\uc774\ubbf8\uc9c0 \ud30c\uc77c\ub9cc \uc5c5\ub85c\ub4dc\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  serverFailed: "\uc11c\ubc84 \uc694\uccad\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  frameServerFailed: "\ud504\ub808\uc784 \ubd84\uc11d \uc11c\ubc84 \uc694\uccad\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  textTooShort: "\ud14d\uc2a4\ud2b8\ub294 \ucd5c\uc18c 10\uc790 \uc774\uc0c1 \uc785\ub825\ud574\uc57c \ud569\ub2c8\ub2e4.",
  textServerFailed: "\ud14d\uc2a4\ud2b8 \ubd84\uc11d \uc11c\ubc84 \uc694\uccad\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
};

export function getApiBaseUrl() {
  return IMAGE_BASE_URL;
}

export async function fetchPrediction(file) {
  const imageData = new FormData();
  imageData.append('file', file);

  if (file.size > MAX_FILE_SIZE) {
    return { error: ERROR_MESSAGES.imageSize };
  }

  if (file.type && !file.type.startsWith('image/')) {
    return { error: ERROR_MESSAGES.imageType };
  }

  try {
    const response = await fetch(`${IMAGE_BASE_URL}/predict`, {
      method: 'POST',
      body: imageData,
    });

    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    return { error: ERROR_MESSAGES.serverFailed };
  }
}

export async function fetchFramePrediction(file) {
  const imageData = new FormData();
  imageData.append('file', file);

  try {
    const response = await fetch(`${IMAGE_BASE_URL}/predict`, {
      method: 'POST',
      body: imageData,
    });

    return await response.json();
  } catch (error) {
    console.error('Error analyzing video frame:', error);
    return { error: ERROR_MESSAGES.frameServerFailed };
  }
}

export async function saveCorrection(file, correctLabel, prediction) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('correct_label', correctLabel);

  const appendIfPresent = (key, value) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  };

  appendIfPresent('predicted_label', prediction?.label);
  appendIfPresent('predicted_probability', prediction?.suspicious_score);
  appendIfPresent('selected_generator_model', prediction?.grad_cam?.model);
  appendIfPresent('sd_prob', prediction?.model_probs?.sd);
  appendIfPresent('mj_prob', prediction?.model_probs?.mj);
  appendIfPresent('mj6_prob', prediction?.model_probs?.mj6);
  appendIfPresent('bg_prob', prediction?.model_probs?.bg);
  appendIfPresent('sd3_prob', prediction?.model_probs?.sd3);
  appendIfPresent('dalle3_prob', prediction?.model_probs?.dalle3);
  appendIfPresent('univfd_prob', prediction?.model_probs?.univfd);

  try {
    const response = await fetch(`${IMAGE_BASE_URL}/save-correction`, {
      method: 'POST',
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.error('Error saving correction:', error);
    return null;
  }
}

export async function fetchTextDetection(text) {
  if (text.trim().length < 10) {
    return { error: ERROR_MESSAGES.textTooShort };
  }

  try {
    const response = await fetch(`${IMAGE_BASE_URL}/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error detecting text:', error);
    return { error: ERROR_MESSAGES.textServerFailed };
  }
}
