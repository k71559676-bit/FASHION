// VÉRTICE — carga de fotografía de persona y prenda, selección de catálogo y validación.
const $ = (id) => document.getElementById(id);
const toast = $('toast');
let toastTimer;
const state = {
  person: { file: null, url: null },
  garment: { file: null, url: null, source: null },
  selectedCard: null
};

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function revoke(slot) {
  if (state[slot].url && state[slot].source !== 'catalog') URL.revokeObjectURL(state[slot].url);
  state[slot] = { file: null, url: null, source: null };
}


// Extrae el tono dominante de la foto localmente (sin subirla a ningún servidor).
function adaptThemeFromPhoto(imageUrl) {
  const image = new Image();
  image.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const sampleSize = 48;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      ctx.drawImage(image, 0, 0, sampleSize, sampleSize);
      const pixels = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < pixels.length; i += 16) {
        const alpha = pixels[i + 3];
        if (alpha < 150) continue;
        const pr = pixels[i], pg = pixels[i + 1], pb = pixels[i + 2];
        const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
        // Excluye píxeles casi blancos/negros para que el acento recoja mejor el color de la foto.
        if (max > 246 || max < 24 || max - min < 18) continue;
        r += pr; g += pg; b += pb; count++;
      }
      if (!count) {
        for (let i = 0; i < pixels.length; i += 16) {
          r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; count++;
        }
      }
      if (!count) return;
      const color = { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
      const hsl = rgbToHsl(color.r, color.g, color.b);
      const hue = Math.round(hsl.h);
      const saturation = Math.max(35, Math.min(68, Math.round(hsl.s * 0.72)));
      const accent = `hsl(${hue} ${saturation}% 76%)`;
      const glow = `hsla(${hue} ${Math.max(35, saturation)}% 48% / .19)`;
      const panelGlow = `hsla(${hue} ${Math.max(30, saturation - 8)}% 35% / .13)`;
      document.documentElement.style.setProperty('--photo-hue', hue);
      document.documentElement.style.setProperty('--photo-accent', accent);
      document.documentElement.style.setProperty('--photo-glow', glow);
      document.documentElement.style.setProperty('--photo-panel-glow', panelGlow);
      document.body.classList.add('photo-themed');
      const status = $('photoThemeStatus');
      if (status) status.innerHTML = `<span class="theme-status-dot"></span><span>Ambiente adaptado a los tonos de tu foto <b style="color:${accent}">●</b></span>`;
    } catch (error) {
      console.warn('No se pudo analizar el color de la fotografía:', error);
    }
  };
  image.onerror = () => notify('La foto se cargó, pero no pudimos adaptar sus colores.');
  image.src = imageUrl;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > .5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function resetPhotoTheme() {
  document.body.classList.remove('photo-themed');
  ['--photo-hue', '--photo-accent', '--photo-glow', '--photo-panel-glow'].forEach(name => document.documentElement.style.removeProperty(name));
  const status = $('photoThemeStatus');
  if (status) status.innerHTML = '<span class="theme-status-dot"></span><span>El ambiente visual se adaptará automáticamente a los tonos de tu fotografía.</span>';
}

function setUpload(slot, file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    notify('Formato no válido. Utiliza JPG, PNG o WEBP.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    notify('La imagen supera los 10 MB. Elige un archivo más ligero.');
    return;
  }
  revoke(slot);
  state[slot].file = file;
  state[slot].url = URL.createObjectURL(file);
  state[slot].source = 'upload';
  renderUpload(slot);
  if (slot === 'person') adaptThemeFromPhoto(state.person.url);
  updateReadiness();
  notify(slot === 'person' ? 'Tu fotografía se cargó correctamente.' : 'La fotografía de la prenda se cargó correctamente.');
}

function renderUpload(slot) {
  const cap = slot === 'person' ? 'person' : 'garment';
  const url = state[slot].url;
  $(cap + 'Preview').src = url || '';
  $(cap + 'Preview').classList.toggle('hidden', !url);
  $(cap + 'Empty').classList.toggle('hidden', !!url);
  $(cap + 'Ready').classList.toggle('hidden', !url);
  $('remove' + (slot === 'person' ? 'Person' : 'Garment')).classList.toggle('hidden', !url);
  if (slot === 'garment') {
    $('catalogSelected').textContent = state.garment.source === 'catalog'
      ? 'Prenda seleccionada desde la colección de ejemplo.'
      : url ? 'Prenda propia cargada correctamente.' : 'Selecciona una prenda para cargarla en el probador.';
  }
}

function clearUpload(slot) {
  revoke(slot);
  if (slot === 'person') $('personInput').value = '';
  else $('garmentInput').value = '';
  renderUpload(slot);
  if (slot === 'person') resetPhotoTheme();
  if (slot === 'garment' && state.selectedCard) {
    state.selectedCard.classList.remove('selected');
    state.selectedCard = null;
  }
  updateReadiness();
}

$('personInput').addEventListener('change', e => setUpload('person', e.target.files[0]));
$('garmentInput').addEventListener('change', e => setUpload('garment', e.target.files[0]));
$('removePerson').addEventListener('click', () => clearUpload('person'));
$('removeGarment').addEventListener('click', () => clearUpload('garment'));

function setupDropzone(slot) {
  const zone = $(slot + 'Dropzone');
  ['dragenter', 'dragover'].forEach(eventName => zone.addEventListener(eventName, e => {
    e.preventDefault(); zone.classList.add('is-dragging');
  }));
  ['dragleave', 'drop'].forEach(eventName => zone.addEventListener(eventName, e => {
    e.preventDefault(); zone.classList.remove('is-dragging');
  }));
  zone.addEventListener('drop', e => setUpload(slot, e.dataTransfer.files[0]));
}
setupDropzone('person');
setupDropzone('garment');

const cards = [...document.querySelectorAll('.product-card')];
cards.forEach(card => card.addEventListener('click', () => {
  if (state.garment.url && state.garment.source === 'upload') {
    const replace = confirm('Ya cargaste una foto de una prenda. ¿Quieres reemplazarla por esta prenda de ejemplo?');
    if (!replace) return;
  }
  if (state.garment.source === 'upload') revoke('garment');
  state.garment = { file: null, url: card.dataset.image, source: 'catalog' };
  if (state.selectedCard) state.selectedCard.classList.remove('selected');
  state.selectedCard = card;
  card.classList.add('selected');
  renderUpload('garment');
  updateReadiness();
  notify('Prenda de ejemplo seleccionada.');
}));

document.querySelectorAll('.category-tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.category-tab').forEach(t => t.classList.toggle('active', t === tab));
  cards.forEach(card => card.classList.toggle('hidden', tab.dataset.category !== 'todos' && card.dataset.category !== tab.dataset.category));
}));

function updateReadiness() {
  const hasPerson = !!state.person.url;
  const hasGarment = !!state.garment.url;
  $('personStatus').textContent = (hasPerson ? '✓' : '○') + ' Fotografía de la persona ' + (hasPerson ? 'lista' : 'pendiente');
  $('garmentStatus').textContent = (hasGarment ? '✓' : '○') + ' Fotografía de la prenda ' + (hasGarment ? 'lista' : 'pendiente');
  $('tryOnButton').disabled = !(hasPerson && hasGarment);
  $('readinessLabel').textContent = hasPerson && hasGarment ? 'IMÁGENES LISTAS' : 'ESPERANDO IMÁGENES';
  $('readinessLabel').classList.toggle('ready-label', hasPerson && hasGarment);
  $('resultEmpty').classList.toggle('hidden', hasPerson && hasGarment);
  $('comparisonPreview').classList.toggle('hidden', !(hasPerson && hasGarment));
  if (hasPerson && hasGarment) {
    $('comparePerson').src = state.person.url;
    $('compareGarment').src = state.garment.url;
    $('resultTitle').textContent = 'Tus imágenes están listas';
    $('resultDescription').textContent = 'Ya puedes enviar la fotografía de la persona y la prenda al motor de prueba virtual cuando la integración con IA esté configurada.';
  } else {
    $('resultTitle').textContent = 'Prepara tus dos imágenes';
    $('resultDescription').textContent = 'Carga tu fotografía y la imagen de la prenda. Podrás revisar ambas antes de enviarlas al motor de inteligencia artificial.';
  }
}

$('tryOnButton').addEventListener('click', () => {
  if (!state.person.file || !(state.garment.file || state.garment.source === 'catalog')) return;
  notify('Las dos imágenes están listas. El siguiente paso es conectar FASHN AI en Cloudflare Worker.');
  $('resultDescription').textContent = 'Validación completada: tenemos la imagen de la persona y la prenda. La generación real se activará al configurar la API de FASHN AI.';
});

$('resetThemeButton').addEventListener('click', () => { resetPhotoTheme(); notify('Se restauró el tema visual original.'); });

$('resetButton').addEventListener('click', () => {
  clearUpload('person');
  clearUpload('garment');
  document.querySelectorAll('.category-tab').forEach(t => t.classList.toggle('active', t.dataset.category === 'todos'));
  cards.forEach(card => card.classList.remove('hidden', 'selected'));
  notify('El probador se ha reiniciado.');
});

$('menuToggle').addEventListener('click', () => document.querySelector('.main-nav').classList.toggle('open'));
document.querySelectorAll('.main-nav a').forEach(a => a.addEventListener('click', () => document.querySelector('.main-nav').classList.remove('open')));
