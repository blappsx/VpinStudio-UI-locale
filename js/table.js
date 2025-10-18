import { state } from './state.js';
import { esc } from './utils.js';
import { ensureWheelForGame } from './media.js';
import { openDetails } from './modal.js';
import { t } from './i18n.js';

export function updateCounter(){
  const { counterEl } = state.dom;
  if (counterEl) counterEl.textContent = `${state.filteredGames.length} / ${state.allGames.length}`;
}

export function applySortFilter() {
  const q = (state.prefs.search || '').trim().toLowerCase();
  const all = state.allGames;
  // filtre
  state.filteredGames = all.filter(g => {
    if (!q) return true;
    return String(g.id).toLowerCase().includes(q) ||
           String(g.gameDisplayName||'').toLowerCase().includes(q);
  });
  // tri
  const { key, dir } = state.prefs.sort;
  state.filteredGames.sort((a,b) => {
    if (key === 'id')   return (Number(a.id) - Number(b.id)) * dir;
    if (key === 'name') return String(a.gameDisplayName||'').localeCompare(String(b.gameDisplayName||'')) * dir;
    return (state.allGames.indexOf(a) - state.allGames.indexOf(b)) * dir;
  });
}

function setSortIndicator() {
  const ths = state.dom.out.querySelectorAll('thead th');
  ths.forEach((th, idx) => {
    th.classList.remove('sort-asc','sort-desc','no-sort');
    const key = idx===0 ? 'index' : idx===1 ? 'name' : idx===2 ? 'id' : null;
    if (idx===3) th.classList.add('no-sort');
    if (key && key === state.prefs.sort.key) {
      th.classList.add(state.prefs.sort.dir===1 ? 'sort-asc' : 'sort-desc');
    }
  });
}

export function renderTable() {
  const { out } = state.dom;
  if (state.filteredGames.length === 0) {
    out.innerHTML = `<div class="muted">${t('noTables')}</div>`;
    updateCounter();
    return;
  }

	const rows = state.filteredGames.map((g,i)=>`
		<tr data-gameid="${esc(g.id)}" class="row-clickable">
		  <td class="center td-num" data-label="#">#${i+1}</td>
		  <td data-label="${t('thTable')}">
			<div class="namecell">
			  <span class="wheel-slot"><span class="placeholder">img</span></span>
			  <div class="gtexts"><span class="gname">${esc(g.gameDisplayName)}</span></div>
			</div>
		  </td>
		  <td class="mono td-id" data-label="${t('thId')}">#${esc(g.id)}</td>
		  <td class="center actions" data-label="${t('thAction')}">
			<button data-action="play" data-id="${esc(g.id)}">${t('playEmu')}</button>
			<button class="btn-secondary" data-action="launch" data-id="${esc(g.id)}">${t('playFrontend')}</button>
		  </td>
		</tr>
	  `).join('');

	  out.innerHTML = `
		<table class="tbl">
		  <colgroup>
			<col style="width:70px">
			<col>
			<col style="width:140px">
			<col style="width:180px">
		  </colgroup>
		  <thead>
			<tr>
			  <th class="center">${t('thHash')}</th>
			  <th>${t('thTable')}</th>
			  <th>${t('thId')}</th>
			  <th class="center">${t('thAction')}</th>
			</tr>
		  </thead>
		  <tbody>${rows}</tbody>
		</table>
	  `;

  // tri par clic
  out.querySelectorAll('thead th').forEach((th, idx) => {
    if (idx === 3) return;
    th.addEventListener('click', () => {
      const key = idx===0 ? 'index' : idx===1 ? 'name' : 'id';
      if (state.prefs.sort.key === key) state.prefs.sort.dir = -state.prefs.sort.dir;
      else { state.prefs.sort.key = key; state.prefs.sort.dir = 1; }
      // le savePrefs est géré dans main (après mutation)
      applySortFilter();
      renderTable();
      setSortIndicator();
    });
  });
  setSortIndicator();

  // clic ligne -> fiche
  out.querySelectorAll('tbody tr').forEach(tr => {
    tr.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') return;
      const id = tr.dataset.gameid;
      openDetails(id);
    });
  });

  // wheels
  state.filteredGames.forEach(g => ensureWheelForGame(g.id).then(info => {
    const tr = out.querySelector(`tr[data-gameid="${CSS.escape(String(g.id))}"]`);
    if (!tr) return;
    const slot = tr.querySelector('.wheel-slot');
    if (info && info.url) {
      tr.style.setProperty('--wheel-bg', `url("${info.url}")`);
      tr.classList.add('has-bg');
      const img = new Image();
      img.className='wheel'; img.alt='wheel'; img.decoding='async'; img.loading='lazy';
      img.src = info.url; img.title = info.url; img.draggable=false;
      img.onerror = () => { slot.innerHTML = `<span class="placeholder">—</span>`; };
      slot.innerHTML=''; slot.appendChild(img);
    } else {
      slot.innerHTML = `<span class="placeholder">—</span>`;
    }
  }));

  updateCounter();
}
