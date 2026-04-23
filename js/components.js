import { state } from './state.js';
import { esc } from './utils.js';
import { getComponents } from './api.js';
import { t } from './i18n.js';
import { openModal } from './modal.js';

const TYPE_LABELS = {
  vpinball: 'Visual Pinball',
  vpinmame: 'VPin MAME',
  b2sbackglass: 'Backglass Server',
  freezy: 'Freezy',
  flexdmd: 'FlexDMD',
  doflinx: 'DOFLinx',
  dof: 'DOF'
};

function getComponentLabel(type) {
  return TYPE_LABELS[type] || String(type || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderComponent(item) {
  const installed = !!item?.installed;
  const installedVersion = installed ? (item?.installedVersion || '—') : t('notInstalled');
  const latestVersion = item?.latestReleaseVersion || '—';
  const githubUrl = item?.url
    ? `<a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.url)}</a>`
    : '—';
  const hasUpdate = installed && !!item?.versionDiff;
  const isMissing = !installed;
  const badgeClass = isMissing
    ? 'component-badge is-missing'
    : (hasUpdate ? 'component-badge is-warn' : 'component-badge is-ok');
  const badgeText = isMissing
    ? t('notInstalled')
    : (hasUpdate ? t('updateAvailable') : t('upToDate'));
  const installedClass = hasUpdate ? 'component-value is-outdated' : 'component-value';

  return `
    <section class="component-item ${!installed ? 'is-missing' : ''}">
      <h3 class="component-title">${esc(getComponentLabel(item?.type))}</h3>
      <div class="component-grid">
        <div class="component-label">${t('installedVersion')}:</div>
        <div class="${installedClass}">${esc(installedVersion)}</div>

        <div class="component-label">${t('latestReleaseVersion')}:</div>
        <div class="component-value is-latest">${esc(latestVersion)}</div>

        <div class="component-label">${t('githubUrl')}:</div>
        <div class="component-value">${githubUrl}</div>

        <div class="component-label">Status:</div>
        <div class="component-value"><span class="${badgeClass}">${badgeText}</span></div>
      </div>
    </section>
  `;
}

export async function openComponentsModal() {
  const { modalTitle, modalBody, updatesBtn } = state.dom;
  const previousLabel = updatesBtn ? updatesBtn.textContent : '';

  const wheel = document.getElementById('modal-wheel');
  if (wheel) {
    wheel.style.display = 'none';
    wheel.removeAttribute('src');
  }

  const modalCard = document.querySelector('.modal-card');
  if (modalCard) {
    modalCard.style.removeProperty('--modal-bg');
  }

  try {
    if (updatesBtn) {
      updatesBtn.disabled = true;
      updatesBtn.textContent = '⏳';
    }

    modalTitle.textContent = t('updatesTitle');
    modalBody.innerHTML = `<div class="kmuted">Loading…</div>`;
    openModal();

    const data = await getComponents();
    const items = Array.isArray(data) ? data : [];

    modalTitle.textContent = t('updatesTitle');
    modalBody.innerHTML = items.length
      ? `<div class="components-list">${items.map(renderComponent).join('')}</div>`
      : `<div class="muted">${t('noComponents')}</div>`;
  } catch (err) {
    modalBody.innerHTML = `<div class="err">Error: ${esc(err.message || err)}</div>`;
  } finally {
    if (updatesBtn) {
      updatesBtn.disabled = false;
      updatesBtn.textContent = previousLabel || t('updates');
    }
  }
}
