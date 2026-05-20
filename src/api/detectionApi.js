const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || "http://localhost:8000";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_FILE_SIZE = 100 * 1024 * 1024;

export function getApiBaseUrl() {
  return IMAGE_BASE_URL;
}

export async function fetchPrediction(file) {
  const imageData = new FormData();
  imageData.append('file', file);

  if (file.size > MAX_FILE_SIZE) {
    return { error: "File size exceeds 10MB." };
  }

  if (file.type && !file.type.startsWith('image/')) {
    return { error: "Invalid file type. Please upload an image." };
  }

  try {
    const response = await fetch(`${IMAGE_BASE_URL}/predict`, {
      method: 'POST',
      body: imageData,
    });

    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    return { error: "Server request failed." };
  }
}

export async function fetchVideoPrediction(file) {
  const videoData = new FormData();
  videoData.append('file', file);

  if (file.size > MAX_VIDEO_FILE_SIZE) {
    return { error: "Video file size exceeds 100MB." };
  }

  if (file.type && !file.type.startsWith('video/')) {
    return { error: "Invalid file type. Please upload a video." };
  }

  try {
    const response = await fetch(`${IMAGE_BASE_URL}/predict-video`, {
      method: 'POST',
      body: videoData,
    });

    return await response.json();
  } catch (error) {
    console.error('Error uploading video:', error);
    return { error: "Video server request failed." };
  }
}

export async function fetchFramePrediction(file) {
  const imageData = new FormData();
  imageData.append('file', file);

  try {
    const response = await fetch(`${IMAGE_BASE_URL}/predict-frame`, {
      method: 'POST',
      body: imageData,
    });

    return await response.json();
  } catch (error) {
    console.error('Error analyzing video frame:', error);
    return { error: "Frame server request failed." };
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
  appendIfPresent('predicted_probability', prediction?.probability);
  appendIfPresent('selected_generator_model', prediction?.generator_model);
  appendIfPresent('sd_prob', prediction?.probs?.sd);
  appendIfPresent('mj_prob', prediction?.probs?.mj);
  appendIfPresent('bg_prob', prediction?.probs?.bg);

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
    return { error: "Text must be at least 10 characters." };
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
    return { error: "Text server request failed." };
  }
}
