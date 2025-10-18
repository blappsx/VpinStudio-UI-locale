// js/frontend.js
import { getFrontendInfo } from './api.js';
import { t } from './i18n.js';

export async function updateRestartButtonLabel() {
  const btn = document.getElementById('restart');
  if (!btn) return;

  let label = t('restartGeneric');

  try {
    const info = await getFrontendInfo();
    const name = info?.name || info?.frontendType || 'Frontend';
    label = t('restartWithName', { name });
  } catch (_) {
    // fallback
  }
  btn.textContent = label;
  btn.setAttribute('aria-label', label);
}
