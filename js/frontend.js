// js/frontend.js
import { getFrontendInfo, getGameStatus, getTableDetails } from './api.js';
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

export async function updateActiveGameButtonLabel() {
  const btn = document.getElementById('activeGame');
  if (!btn) return;

  btn.textContent = t('activeGameGeneric');
  btn.setAttribute('aria-label', t('activeGameGeneric'));
  btn.dataset.gameid = '';

  try {
    const status = await getGameStatus();

    const activeId = Number(status?.gameId);
    const lastActiveId = Number(status?.lastActiveId);
    const isActive = Boolean(status?.active);

    const targetId = isActive && activeId > 0
      ? activeId
      : (lastActiveId > 0 ? lastActiveId : -1);

    if (targetId <= 0) {
      const label = t('activeGameNone');
      btn.textContent = label;
      btn.setAttribute('aria-label', label);
      return;
    }

    const details = await getTableDetails(targetId);
    const name =
      details?.gameDisplayName ||
      details?.gameName ||
      `#${targetId}`;

    const label = isActive
      ? t('activeGameWithName', { name })
      : t('lastGameWithName', { name });

    btn.textContent = label;
    btn.setAttribute('aria-label', label);
    btn.dataset.gameid = String(targetId);

  } catch (_) {
    const label = t('activeGameGeneric');
    btn.textContent = label;
    btn.setAttribute('aria-label', label);
    btn.dataset.gameid = '';
  }
}
export async function updateActiveGameInline() {
  const el = document.getElementById('activeGameInline');
  if (!el) return;

	el.textContent = '—';
	el.dataset.gameid = '';
	
	let isActive = false;

  try {
    const status = await getGameStatus();

    const activeId = Number(status?.gameId);
    const lastActiveId = Number(status?.lastActiveId);
    const isActive = Boolean(status?.active);

    const targetId = isActive && activeId > 0
      ? activeId
      : (lastActiveId > 0 ? lastActiveId : -1);

    if (targetId <= 0) {
      el.textContent = '—';
      return;
    }

    const details = await getTableDetails(targetId);
    const name =
      details?.gameDisplayName ||
      details?.gameName ||
      `#${targetId}`;

	const icon = isActive ? '🟢' : '⚪';
	el.textContent = `${icon} ${name}`;
    el.dataset.gameid = String(targetId);

  } catch {
    el.textContent = '—';
    el.dataset.gameid = '';
  }
  	el.style.color = isActive ? '#22c55e' : '#c7d2fe';
	el.style.fontWeight = isActive ? '600' : '400';
}