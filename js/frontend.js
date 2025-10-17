// js/frontend.js
import { getFrontendInfo } from './api.js';

export async function updateRestartButtonLabel() {
  const btn = document.getElementById('restart');
  if (!btn) return;

  // Valeur par défaut si l’API échoue
  let label = '🔁 Restart Frontend';

  try {
    const info = await getFrontendInfo();
    const name = info?.name || info?.frontendType || 'Frontend';
    label = `🔁 Restart ${name}`;
  } catch (_) {
    // on garde le fallback
  }

  btn.textContent = label;
  btn.setAttribute('aria-label', label);
}
