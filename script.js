const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const image = document.getElementById("image");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const imageUpload = document.getElementById("imageUpload");
const emotionResult = document.getElementById("emotionResult");

let stream, interval;

const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

// Load models
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
  faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
]).then(() => {
  emotionResult.textContent = "✅ Models loaded — ready!";
});

startBtn.addEventListener("click", async () => {
  stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  image.hidden = true;
  video.hidden = false;

  interval = setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    canvas.width = video.width;
    canvas.height = video.height;

    const resized = faceapi.resizeResults(detections, {
      width: video.width,
      height: video.height,
    });

    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceLandmarks(canvas, resized);

    if (resized.length > 0) {
      const expressions = resized[0].expressions;
      const maxValue = Math.max(...Object.values(expressions));
      const emotion = Object.keys(expressions).find(
        (key) => expressions[key] === maxValue
      );
      emotionResult.textContent = `Emotion: ${emotion} (${(maxValue * 100).toFixed(1)}%)`;
    }
  }, 200);
});

stopBtn.addEventListener("click", () => {
  if (stream) stream.getTracks().forEach((track) => track.stop());
  clearInterval(interval);
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  emotionResult.textContent = "Camera stopped.";
});

imageUpload.addEventListener("change", async () => {
  const file = imageUpload.files[0];
  if (!file) return;

  const img = await faceapi.bufferToImage(file);
  image.src = img.src;
  image.hidden = false;
  video.hidden = true;

  const detections = await faceapi
    .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceExpressions();

  canvas.width = image.width;
  canvas.height = image.height;

  const resized = faceapi.resizeResults(detections, {
    width: image.width,
    height: image.height,
  });

  faceapi.draw.drawDetections(canvas, resized);
  faceapi.draw.drawFaceLandmarks(canvas, resized);

  if (resized.length > 0) {
    const expressions = resized[0].expressions;
    const maxValue = Math.max(...Object.values(expressions));
    const emotion = Object.keys(expressions).find(
      (key) => expressions[key] === maxValue
    );
    emotionResult.textContent = `Emotion: ${emotion} (${(maxValue * 100).toFixed(1)}%)`;
  } else {
    emotionResult.textContent = "No face detected.";
  }
});
