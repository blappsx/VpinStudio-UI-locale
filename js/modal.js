import { state } from './state.js';
import { esc } from './utils.js';
import { getTableDetails } from './api.js';
import { ensureWheelForGame } from './media.js';
import { t } from './i18n.js';
import { getHighscores } from './api.js';


export function openModal() {
  const { modal } = state.dom;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=> modal.classList.add('visible'));
}
export function closeModal() {
  const { modal, modalBody } = state.dom;
  modal.classList.remove('visible');
  modal.setAttribute('aria-hidden','true');
  const onEnd = (e) => {
    if (!e || e.target.classList.contains('modal-card')) {
      modal.classList.remove('open');
      modalBody.innerHTML='';
      modal.removeEventListener('transitionend', onEnd);
    }
  };
  modal.addEventListener('transitionend', onEnd);
}

export async function openDetails(gameId){
  const { modalTitle, modalBody } = state.dom;
  try {
    modalTitle.textContent = t('techSheet');
    modalBody.innerHTML = `<div class="kmuted">Loading…</div>`;
    openModal();

    const d = await getTableDetails(gameId);
    const fmtDate = ms => ms ? new Date(ms).toLocaleString() : '—';
    const listChips = (arr) => Array.isArray(arr)&&arr.length
      ? `<div class="kchips">${arr.map(x=>`<span class="kchip">${esc(x)}</span>`).join('')}</div>` : '—';
    const splitCSV = (s) => (typeof s === 'string' && s.trim()) ? s.split(',').map(x=>x.trim()).filter(Boolean) : [];
    const safe = v => (v===null||v===undefined||v==='') ? '—' : esc(v);

    const title = d.gameDisplayName || d.gameName || '(no name)';
    modalTitle.textContent = title;

    // wheel titre + fond
    const wheelImg  = document.getElementById('modal-wheel');
    const modalCard = document.querySelector('.modal-card');
    if (wheelImg) {
      wheelImg.src = ''; wheelImg.style.display='none';
      ensureWheelForGame(gameId).then(info=>{
        if (info && info.url) {
          wheelImg.src = info.url; wheelImg.style.display='block';
          if (modalCard) modalCard.style.setProperty('--modal-bg', `url("${info.url}")`);
        } else {
          if (modalCard) modalCard.style.removeProperty('--modal-bg');
        }
      });
    }

    const launchers = Array.isArray(d.launcherList) ? d.launcherList : [];
    const themes = splitCSV(d.gameTheme);
    const tags   = splitCSV(d.tags).map(t=>t.replace(/^,+/,''));
    const linkMain = d.url ? `<a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.url)}</a>` : '—';
    const link2    = d.webLink2Url ? `<a href="${esc(d.webLink2Url)}" target="_blank" rel="noopener">${esc(d.webLink2Url)}</a>` : '—';

    modalBody.innerHTML = `
		<dl class="kv">
		  <dt>${t('mName')}</dt><dd>${esc(title)}</dd>
		  <dt>${t('mFile')}</dt><dd class="kmono">${safe(d.gameFileName)}</dd>
		  <dt>${t('mManufacturer')}</dt><dd>${safe(d.manufacturer)}</dd>
		  <dt>${t('mYear')}</dt><dd>${safe(d.gameYear)}</dd>
		  <dt>${t('mVersion')}</dt><dd>${safe(d.gameVersion)}</dd>
		  <dt>${t('mDesigner')}</dt><dd>${safe(d.designedBy)}</dd>
		  <dt>${t('mAuthors')}</dt><dd>${safe(d.author)}</dd>
		  <dt>${t('mThemes')}</dt><dd>${themes.length ? listChips(themes) : '—'}</dd>
		  <dt>${t('mTags')}</dt><dd>${tags.length ? listChips(tags) : '—'}</dd>
		  <dt>${t('mPlayers')}</dt><dd>${safe(d.numberOfPlayers)}</dd>
		  <dt>${t('mPlays')}</dt><dd>${safe(d.numberPlays)}</dd>
		  <dt>${t('mLastPlayed')}</dt><dd>${fmtDate(d.lastPlayed)}</dd>
		  <dt>${t('mAdded')}</dt><dd>${fmtDate(d.dateAdded)}</dd>
		  <dt>${t('mModified')}</dt><dd>${fmtDate(d.dateModified)}</dd>
		  <dt>${t('mROM')}</dt><dd class="kmono">${safe(d.romName || d.romAlt)}</dd>
		  <dt>${t('mIPDB')}</dt><dd>${d.ipdbnum ? `<a href="https://www.ipdb.org/machine.cgi?id=${esc(d.ipdbnum)}" target="_blank" rel="noopener">${esc(d.ipdbnum)}</a>` : '—'}</dd>
		  <dt>${t('mLink')}</dt><dd>${linkMain}</dd>
		  <dt>${t('mLink2')}</dt><dd>${link2}</dd>
		  <dt>${t('mLaunchers')}</dt><dd>${launchers.length ? listChips(launchers) : '—'}</dd>
		  <dt>${t('mNotes')}</dt><dd class="kblock">${safe(d.gDetails || d.gNotes || d.notes)}</dd>
		</dl>
    `;
	// ===== Highscores =====
	try {
	  const scores = await getHighscores(gameId);
	  if (scores?.raw) {
		const hsSection = document.createElement('div');
		hsSection.className = 'hs-section';
		// Remplace le caractère � par une espace insécable
		const rawClean = scores.raw
		  .replace(/�/g, '\u00A0')   // caractère insécable à la place du caractère erroné
		  .replace(/\n/g, '\n');     // pour les retours à la ligne

		hsSection.innerHTML = `
		  <h3 class="hs-title">Highscores</h3>
		  <pre class="hs-raw">${esc(rawClean)}</pre>
		`;
		modalBody.appendChild(hsSection);
	  }
	} catch (err) {
	  console.warn('No highscores available:', err);
	}
  } catch(err){
    modalBody.innerHTML = `<div class="err">Error: ${esc(err.message||err)}</div>`;
  }
}

export function wireModalClose() {
  const { modal, modalClose1, modalClose2, modalBack } = state.dom;
  modalClose1.addEventListener('click', closeModal);
  modalClose2.addEventListener('click', closeModal);
  modalBack  && modalBack.addEventListener('click', closeModal);
  // clic intérieur (hors éléments interactifs) => fermer
  const card = document.querySelector('.modal-card');
  if (card) {
    card.addEventListener('click', e => {
      if (e.target.closest('button, a, input, select, textarea')) return;
      closeModal();
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
}
