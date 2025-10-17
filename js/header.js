// js/header.js
import { state } from './state.js';
import { getSystem, getAvatar } from './api.js';

export async function loadSystemHeader() {
  const imgEl  = document.getElementById('avatar');
  const nameEl = document.getElementById('sysName');
  const verEl  = document.getElementById('sysVersion');

  // reset visuel
  if (imgEl) { imgEl.style.display = 'none'; imgEl.removeAttribute('src'); }
  if (nameEl) nameEl.textContent = '—';
  if (verEl)  verEl.textContent  = '—';

  // Avatar (PNG)
  try {
    const blob = await getAvatar();
    if (imgEl && blob) {
      const url = URL.createObjectURL(blob);
      imgEl.src = url;
      imgEl.style.display = 'block';
      // (optionnel) à la prochaine MAJ, tu peux révoquer l’URL si besoin : URL.revokeObjectURL(url)
    }
  } catch (_) { /* silencieux */ }

  // Infos système
  try {
    const data = await getSystem();
    if (nameEl) nameEl.textContent = data.systemName || '—';
    if (verEl)  verEl.textContent  = data.version ? `VPinStudio ${data.version}` : '—';
  } catch (_) { /* silencieux */ }
}
