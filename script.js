const btnGenerate  = document.getElementById('btn-generate');
const btnSave      = document.getElementById('btn-save');
const paletteGrid  = document.getElementById('palette-grid');
const emptyState   = document.getElementById('empty-state');
const savedSection = document.getElementById('saved-section');
const savedList    = document.getElementById('saved-list');
const toast        = document.getElementById('toast');
 
const sizesInputs  = document.querySelectorAll('input[name="palette-size"]');
const formatInputs = document.querySelectorAll('input[name="color-format"]');
 
const state = {
  currentPalette: [],
  paletteSize:    6,
  colorFormat:    'hex'
};
 
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
 
function generateRandomHSL() {
  return {
    h: randomInt(0, 360),
    s: randomInt(50, 95),
    l: randomInt(40, 70)
  };
}
 
function hslToString({ h, s, l }) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}
 
function hslToHex({ h, s, l }) {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
 
  let r, g, b;
  if      (h < 60)  { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
 
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
 
  const toHex = v => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
 
function getTextColor({ l }) {
  return l > 55 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
}
 
function createRandomColor() {
  const hsl = generateRandomHSL();
  return {
    hsl,
    hexString: hslToHex(hsl),
    hslString: hslToString(hsl),
    locked: false
  };
}
 
function createColorCardHTML(color, index) {
  const { hsl, hexString, hslString, locked } = color;
  const displayCode = state.colorFormat === 'hex' ? hexString : hslString;
 
  return `
    <article
      class="color-card ${locked ? 'locked' : ''}"
      role="listitem"
      data-index="${index}"
    >
      <div
        class="color-swatch"
        style="background-color: ${hslString};"
        role="button"
        tabindex="0"
        aria-label="Copiar color ${displayCode}"
        data-copy="${displayCode}"
      ></div>
 
      <div class="color-info">
        <span
          class="color-code"
          title="${displayCode}"
        >${displayCode}</span>
 
        <button
          type="button"
          class="btn-lock"
          aria-label="${locked ? 'Desbloquear' : 'Bloquear'} este color"
          aria-pressed="${locked}"
          data-lock="${index}"
        >${locked ? '🔒' : '🔓'}</button>
      </div>
    </article>
  `;
}
 
function renderPalette() {
  if (state.currentPalette.length === 0) {
    emptyState.hidden = false;
    paletteGrid.innerHTML = '';
    paletteGrid.appendChild(emptyState);
    return;
  }
 
  emptyState.hidden = true;
 
  paletteGrid.innerHTML = state.currentPalette
    .map((color, index) => createColorCardHTML(color, index))
    .join('');
}
 
function renderSavedPalettes() {
  const saved = getSavedPalettes();
  savedSection.hidden = saved.length === 0;
  if (saved.length === 0) return;
 
  savedList.innerHTML = saved.map((palette, paletteIndex) => {
    const swatchesHTML = palette.colors
      .slice(0, 6)
      .map(c => `<div class="saved-swatch" style="background-color: ${c.hslString};"></div>`)
      .join('');
 
    return `
      <div class="saved-palette" role="listitem">
        <div class="saved-preview" aria-hidden="true">${swatchesHTML}</div>
        <div class="saved-meta">
          <p class="saved-count">${palette.colors.length} colores</p>
          <p class="saved-date">${palette.date}</p>
        </div>
        <button
          type="button"
          class="btn-delete-saved"
          data-delete="${paletteIndex}"
          aria-label="Eliminar paleta ${paletteIndex + 1}"
        >Eliminar</button>
      </div>
    `;
  }).join('');
}
 
function generatePalette() {
  state.currentPalette = Array.from(
    { length: state.paletteSize },
    (_, index) => {
      const existing = state.currentPalette[index];
      if (existing && existing.locked) return existing;
      return createRandomColor();
    }
  );
 
  animateGenerateButton();
  renderPalette();
}
 
function toggleLock(index) {
  if (!state.currentPalette[index]) return;
  state.currentPalette[index].locked = !state.currentPalette[index].locked;
  renderPalette();
}
 
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`✓ ${text} copiado`);
  } catch (error) {
    fallbackCopy(text);
  }
}
 
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.cssText = 'position:fixed;opacity:0;';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast(`✓ ${text} copiado`);
  } catch (err) {
    showToast('Error al copiar');
  } finally {
    document.body.removeChild(textarea);
  }
}
 
function showToast(message = '✓ Copiado', duration = 2000) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}
 
function animateGenerateButton() {
  btnGenerate.classList.add('loading');
  btnGenerate.addEventListener(
    'animationend',
    () => btnGenerate.classList.remove('loading'),
    { once: true }
  );
}
 
function getSelectedRadioValue(inputs) {
  const selected = Array.from(inputs).find(input => input.checked);
  return selected ? selected.value : null;
}
 
const STORAGE_KEY = 'paleta-studio-saved';
 
function savePalette() {
  if (state.currentPalette.length === 0) {
    showToast('⚠️ Genera una paleta primero');
    return;
  }
 
  const saved = getSavedPalettes();
  saved.unshift({
    colors: state.currentPalette,
    date: new Date().toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  });
 
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.slice(0, 10)));
    showToast('✓ Paleta guardada');
    renderSavedPalettes();
  } catch {
    showToast('⚠️ No se pudo guardar la paleta');
  }
}
 
function getSavedPalettes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
 
function deleteSavedPalette(index) {
  const saved = getSavedPalettes();
  saved.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  renderSavedPalettes();
  showToast('Paleta eliminada');
}
 
btnGenerate.addEventListener('click', generatePalette);
btnSave.addEventListener('click', savePalette);
 
sizesInputs.forEach(input => {
  input.addEventListener('change', e => {
    state.paletteSize = parseInt(e.target.value, 10);
    if (state.currentPalette.length > 0) generatePalette();
  });
});
 
formatInputs.forEach(input => {
  input.addEventListener('change', e => {
    state.colorFormat = e.target.value;
    renderPalette();
  });
});
 
paletteGrid.addEventListener('click', e => {
  const swatch  = e.target.closest('[data-copy]');
  const lockBtn = e.target.closest('[data-lock]');
 
  if (swatch)  copyToClipboard(swatch.dataset.copy);
  if (lockBtn) toggleLock(parseInt(lockBtn.dataset.lock, 10));
});
 
paletteGrid.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const swatch = e.target.closest('[data-copy]');
  if (swatch) {
    e.preventDefault();
    copyToClipboard(swatch.dataset.copy);
  }
});
 
savedList.addEventListener('click', e => {
  const deleteBtn = e.target.closest('[data-delete]');
  if (deleteBtn) deleteSavedPalette(parseInt(deleteBtn.dataset.delete, 10));
});
 
document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  const isInteractive = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag);
  if (e.key === ' ' && !isInteractive) {
    e.preventDefault();
    generatePalette();
  }
});
 
function init() {
  state.paletteSize  = parseInt(getSelectedRadioValue(sizesInputs), 10);
  state.colorFormat  = getSelectedRadioValue(formatInputs);
  renderSavedPalettes();
  generatePalette();
  console.log('🎨 Paleta Studio listo | Tip: presiona ESPACIO para regenerar');
}
 
init();