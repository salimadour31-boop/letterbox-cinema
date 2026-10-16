// Letterbox Cinema — traitement 100% local dans le navigateur
// Multilingue FR / EN / TZM (Tamazight simplifié)

const i18n = {
  fr: {
    title: "Letterbox Cinema",
    subtitle: "Ajoutez des barres letterbox ou rognez aux ratios cinématiques",
    upload: "Importer image ou vidéo",
    ratio: "Ratio cinématique",
    mode: "Mode",
    letterbox: "Letterbox (barres)",
    crop: "Rogner",
    barColor: "Couleur des barres",
    apply: "Appliquer",
    download: "Télécharger",
    footer: "Outil open source gratuit — Traitement local dans le navigateur"
  },
  en: {
    title: "Letterbox Cinema",
    subtitle: "Add letterbox bars or crop to cinematic ratios",
    upload: "Import image or video",
    ratio: "Cinematic ratio",
    mode: "Mode",
    letterbox: "Letterbox (bars)",
    crop: "Crop",
    barColor: "Bar color",
    apply: "Apply",
    download: "Download",
    footer: "Free open-source tool — Local processing in the browser"
  },
  tzm: {
    title: "Letterbox Cinema",
    subtitle: "Rnu tibbatin letterbox neɣ rogner s ratios n cinema",
    upload: "Ssekcem tugna neɣ tavidyut",
    ratio: "Ratio n cinema",
    mode: "Aɣewwar",
    letterbox: "Letterbox (tibbatin)",
    crop: "Rogner",
    barColor: "Ini n tibbatin",
    apply: "Snes",
    download: "Sider",
    footer: "Allal open source baṭ — Asesfer adigan deg browser"
  }
};

let currentLang = 'fr';
let currentMedia = null; // {type: 'image'|'video', element, src}
let resultCanvas = null;

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) el.textContent = i18n[lang][key];
  });
  document.documentElement.lang = lang === 'tzm' ? 'ber' : lang;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  setLang('fr');
  const fileInput = document.getElementById('fileInput');
  const applyBtn = document.getElementById('applyBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  fileInput.addEventListener('change', handleFile);
  applyBtn.addEventListener('click', applyEffect);
  downloadBtn.addEventListener('click', downloadResult);
});

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const previewCanvas = document.getElementById('previewCanvas');
  const previewVideo = document.getElementById('previewVideo');

  if (file.type.startsWith('image/')) {
    const img = new Image();
    img.onload = () => {
      currentMedia = { type: 'image', element: img, src: url };
      drawPreview(img);
      previewVideo.style.display = 'none';
      previewCanvas.style.display = 'block';
    };
    img.src = url;
  } else if (file.type.startsWith('video/')) {
    previewVideo.src = url;
    previewVideo.style.display = 'block';
    previewCanvas.style.display = 'none';
    currentMedia = { type: 'video', element: previewVideo, src: url };
    previewVideo.onloadeddata = () => drawPreview(previewVideo);
  }
}

function drawPreview(media) {
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  const w = media.videoWidth || media.width;
  const h = media.videoHeight || media.height;
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(media, 0, 0, w, h);
}

function applyEffect() {
  if (!currentMedia) return;
  const ratio = parseFloat(document.getElementById('ratioSelect').value);
  const mode = document.getElementById('modeSelect').value;
  const barColor = document.getElementById('barColor').value;
  const media = currentMedia.element;
  const srcW = media.videoWidth || media.width;
  const srcH = media.videoHeight || media.height;
  const srcRatio = srcW / srcH;

  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  resultCanvas = document.createElement('canvas');
  const rctx = resultCanvas.getContext('2d');

  if (mode === 'letterbox') {
    // Calculer dimensions pour letterbox
    let targetW = srcW, targetH = srcH;
    if (srcRatio > ratio) {
      // Trop large → barres haut/bas
      targetH = Math.round(srcW / ratio);
    } else {
      // Trop haut → barres côtés
      targetW = Math.round(srcH * ratio);
    }
    resultCanvas.width = targetW;
    resultCanvas.height = targetH;
    rctx.fillStyle = barColor;
    rctx.fillRect(0, 0, targetW, targetH);
    const dx = (targetW - srcW) / 2;
    const dy = (targetH - srcH) / 2;
    rctx.drawImage(media, dx, dy, srcW, srcH);
  } else {
    // Crop au ratio
    let cropW = srcW, cropH = srcH, sx = 0, sy = 0;
    if (srcRatio > ratio) {
      cropW = Math.round(srcH * ratio);
      sx = (srcW - cropW) / 2;
    } else {
      cropH = Math.round(srcW / ratio);
      sy = (srcH - cropH) / 2;
    }
    resultCanvas.width = cropW;
    resultCanvas.height = cropH;
    rctx.drawImage(media, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
  }

  // Afficher le résultat
  canvas.width = resultCanvas.width;
  canvas.height = resultCanvas.height;
  ctx.drawImage(resultCanvas, 0, 0);
  document.getElementById('downloadBtn').disabled = false;
}

function downloadResult() {
  if (!resultCanvas) return;
  const link = document.createElement('a');
  link.download = 'letterbox-cinema.png';
  link.href = resultCanvas.toDataURL('image/png');
  link.click();
}

// Pour vidéo simple : on capture une frame pour l'instant (extension future possible avec MediaRecorder)
// Commenté : traitement frame par frame avancé nécessiterait WebCodecs ou ffmpeg.wasm (plus lourd)