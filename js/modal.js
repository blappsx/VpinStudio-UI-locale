import { state } from './state.js';
import { esc } from './utils.js';
import { getTableDetails } from './api.js';
import { ensureWheelForGame } from './media.js';

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
    modalTitle.textContent = 'Fiche technique';
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
        <dt>Name</dt><dd>${esc(title)}</dd>
        <dt>File</dt><dd class="kmono">${safe(d.gameFileName)}</dd>
        <dt>Manufacturer</dt><dd>${safe(d.manufacturer)}</dd>
        <dt>Year</dt><dd>${safe(d.gameYear)}</dd>
        <dt>Version</dt><dd>${safe(d.gameVersion)}</dd>
        <dt>Designer</dt><dd>${safe(d.designedBy)}</dd>
        <dt>Authors</dt><dd>${safe(d.author)}</dd>
        <dt>Themes</dt><dd>${themes.length ? listChips(themes) : '—'}</dd>
        <dt>Tags</dt><dd>${tags.length ? listChips(tags) : '—'}</dd>
        <dt>Players</dt><dd>${safe(d.numberOfPlayers)}</dd>
        <dt>Plays</dt><dd>${safe(d.numberPlays)}</dd>
        <dt>Last played</dt><dd>${fmtDate(d.lastPlayed)}</dd>
        <dt>Added</dt><dd>${fmtDate(d.dateAdded)}</dd>
        <dt>Modified</dt><dd>${fmtDate(d.dateModified)}</dd>
        <dt>ROM</dt><dd class="kmono">${safe(d.romName || d.romAlt)}</dd>
        <dt>IPDB</dt><dd>${d.ipdbnum ? `<a href="https://www.ipdb.org/machine.cgi?id=${esc(d.ipdbnum)}" target="_blank" rel="noopener">${esc(d.ipdbnum)}</a>` : '—'}</dd>
        <dt>Link</dt><dd>${linkMain}</dd>
        <dt>Link 2</dt><dd>${link2}</dd>
        <dt>Launchers</dt><dd>${launchers.length ? listChips(launchers) : '—'}</dd>
        <dt>Notes</dt><dd class="kblock">${safe(d.gDetails || d.gNotes || d.notes)}</dd>
      </dl>
    `;
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
