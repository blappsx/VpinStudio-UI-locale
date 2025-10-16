/**
 * ============================================================================
 *  VpinStudio – UI locale (HTML/CSS/JS)
 *  Fichier : app.js
 * ----------------------------------------------------------------------------
 *  But :
 *    - Lister les émulateurs et tables (Visual Pinball / autres)
 *    - Lancer une table (PUT /games/play/:id) ou via Frontend (GET /frontend/launch/:id)
 *    - Afficher une fiche technique (GET /frontend/tabledetails/:id)
 *    - Afficher les médias (Wheel PNG) (GET /media/:id → /media/:id/Wheel/<name>)
 *    - Hooks (POST /hooks { name, commands[], gameId })
 *    - Contrôles système rapides : Restart, Mute/Unmute
 *
 *  Auteur(s) / crédits :
 *    - Développement & intégration UI : Cédric Blap / ChatGPT
 *    - Backend & API : projet open source VPin Studio
 *      https://github.com/syd711/vpin-studio
 *    - Thanks to Syd711 and leprinco
 *
 *  Version :
 *    - v1.0.0 – 2025-10-14 – Première version stable
 *    - v1.1.0 – 2025-10-16 – Hooks en boutons + Mute/Unmute + améliorations UI
 *
 *  Configuration par défaut :
 *    - Base API : http://192.168.0.5:8089/api/v1  (modifiable dans l’interface)
 *
 *  Endpoints utilisés :
 *    - GET    /emulators
 *    - GET    /games/knowns/<emuId>
 *    - PUT    /games/play/<gameId>           (body: {})
 *    - GET    /frontend/launch/<gameId>
 *    - GET    /frontend/tabledetails/<gameId>
 *    - GET    /media/<gameId>                (retourne les médias disponibles)
 *    - GET    /media/<gameId>/Wheel/<name>   (image Wheel)
 *    - GET    /frontend/restart
 *    - GET    /system/mute/1                 (Mute)
 *    - GET    /system/mute/0                 (Unmute)
 *    - GET    /hooks                         (liste des hooks)
 *    - POST   /hooks                         (exécuter un hook)
 *
 *  Caractéristiques UI :
 *    - Thème sombre moderne (Inter), responsive desktop/mobile
 *    - Tableau triable, filtre en direct, compteur dynamique
 *    - Lignes cliquables → modal fiche technique (fond flou basé sur la Wheel)
 *    - Sauvegarde locale (localStorage) : base API, émulateur, tri, filtre
 *    - Barre de hooks (boutons générés dynamiquement) + actions Mute/Unmute
 *
 *  Licence / usage :
 *    - MIT License
 *
 *  Dernière modification :
 *    - 2025-16-10 – Cédric Blap / ChatGPT
 * ============================================================================
 */


const baseInput  = document.getElementById('base');
const emuSelect  = document.getElementById('emu');
const refreshBtn = document.getElementById('refresh');
const out        = document.getElementById('out');
const statusEl   = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const searchInput= document.getElementById('search');
const counterEl  = document.getElementById('counter');
const hooksBar   = document.getElementById('hooksBar'); // ⬅️ barre des hooks

// Modal refs
const modal       = document.getElementById('modal');
const modalClose1 = document.getElementById('modal-close');
const modalClose2 = document.getElementById('modal-close-2');
const modalBack   = document.getElementById('modal-backdrop');
const modalBody   = document.getElementById('modal-body');
const modalTitle  = document.getElementById('modal-title');

// State
const wheelCache = new Map();
let allGames = [];
let filteredGames = [];

// ---- PERSISTENCE ----
const LS_KEY = 'vpinstudio.prefs';
let prefs = {
  base: 'http://192.168.0.5:8089/api/v1',
  emuId: null,
  search: '',
  sort: { key: 'index', dir: 1 }, // 'index' | 'name' | 'id'
};

function loadPrefs(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') {
        prefs = {
          ...prefs,
          ...obj,
          sort: obj.sort && typeof obj.sort === 'object'
            ? { key: obj.sort.key || 'index', dir: obj.sort.dir === -1 ? -1 : 1 }
            : { key: 'index', dir: 1 }
        };
      }
    }
  } catch (_) {}
}
function savePrefs(){ try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)); } catch (_) {} }

// Helpers
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const api = path => (prefs.base || baseInput.value || '').trim().replace(/\/+$/,'') + (path.startsWith('/') ? path : '/' + path);

// UI depuis prefs
function applyPrefsToUI(){
  if (baseInput && prefs.base) baseInput.value = prefs.base;
  if (searchInput) searchInput.value = prefs.search || '';
}

// ---------- Compteur ----------
function updateCounter(){
  if (counterEl) counterEl.textContent = `${filteredGames.length} / ${allGames.length}`;
}

// ---------- Tri (entête visuelle) ----------
function setSortIndicator() {
  const ths = out.querySelectorAll('thead th');
  ths.forEach((th, idx) => {
    th.classList.remove('sort-asc','sort-desc','no-sort');
    const key = idx === 0 ? 'index' : idx === 1 ? 'name' : idx === 2 ? 'id' : null;
    if (idx === 3) th.classList.add('no-sort'); // Action non triable
    if (key && key === prefs.sort.key) {
      th.classList.add(prefs.sort.dir === 1 ? 'sort-asc' : 'sort-desc');
    }
  });
}

// ---------- Filtre + Tri ----------
function applySortFilter() {
  const q = (prefs.search || '').trim().toLowerCase();
  filteredGames = allGames.filter(g => {
    if (!q) return true;
    return String(g.id).toLowerCase().includes(q) ||
           String(g.gameDisplayName || '').toLowerCase().includes(q);
  });
  const { key, dir } = prefs.sort;
  filteredGames.sort((a,b) => {
    if (key === 'id')   return (Number(a.id) - Number(b.id)) * dir;
    if (key === 'name') return String(a.gameDisplayName||'').localeCompare(String(b.gameDisplayName||'')) * dir;
    return (allGames.indexOf(a) - allGames.indexOf(b)) * dir; // index
  });
}

// ---------- Rendu de la table ----------
function renderTable() {
  if (filteredGames.length === 0) {
    out.innerHTML = `<div class="muted">Aucune table à afficher.</div>`;
    updateCounter();
    return;
  }

  const rows = filteredGames.map((g, i) => `
    <tr data-gameid="${esc(g.id)}" class="row-clickable">
      <td class="center td-num" data-label="#">
        <span class="hash">#</span>${i + 1}
      </td>
      <td data-label="Table">
        <div class="namecell">
          <span class="wheel-slot"><span class="placeholder">img</span></span>
          <div class="gtexts">
            <span class="gname">${esc(g.gameDisplayName)}</span>
          </div>
        </div>
      </td>
      <td class="mono td-id" data-label="ID">
        <span class="hash">#</span>${esc(g.id)}
      </td>
      <td class="center actions" data-label="Action">
        <button onclick="playGame('${encodeURIComponent(g.id)}', this)">Jouer / Emulateur</button>
        <button class="btn-secondary" onclick="launchFrontend('${encodeURIComponent(g.id)}', this)">Jouer / Frontend</button>
      </td>
    </tr>
  `).join('');

  out.innerHTML = `
    <table class="tbl">
      <colgroup>
        <col style="width:70px">
        <col>
        <col style="width:80px">
        <col style="width:180px">
      </colgroup>
      <thead>
        <tr>
          <th class="center">#</th>
          <th>Table</th>
          <th>ID</th>
          <th class="center">Action</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  // tri par clic sur les th
  const ths = out.querySelectorAll('thead th');
  ths.forEach((th, idx) => {
    if (idx === 3) return; // "Action" non triable
    th.addEventListener('click', () => {
      const key = idx === 0 ? 'index' : idx === 1 ? 'name' : 'id';
      if (prefs.sort.key === key) {
        prefs.sort.dir = -prefs.sort.dir; // toggle
      } else {
        prefs.sort.key = key;
        prefs.sort.dir = 1;
      }
      savePrefs();
      applySortFilter();
      renderTable();
    });
  });

  setSortIndicator();

  // clic sur ligne -> fiche
  out.querySelectorAll('tbody tr').forEach(tr => {
    tr.addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') return;
      const id = tr.dataset.gameid;
      openDetails(id);
    });
  });

  // wheels
  filteredGames.forEach(g => ensureWheelForGame(g.id).then(info => {
    const tr = out.querySelector(`tr[data-gameid="${CSS.escape(String(g.id))}"]`);
    if (!tr) return;
    const slot = tr.querySelector('.wheel-slot');
    if (info && info.url) {
      tr.style.setProperty('--wheel-bg', `url("${info.url}")`);
      tr.classList.add('has-bg');
      const img = new Image();
      img.className = 'wheel';
      img.alt = 'wheel';
      img.decoding = 'async';
      img.loading = 'lazy';
      img.src = info.url;
      img.title = info.url;
      img.onerror = () => { slot.innerHTML = `<span class="placeholder">—</span>`; };
      slot.innerHTML = '';
      img.draggable = false;
      slot.appendChild(img);
    } else {
      if (slot) slot.innerHTML = `<span class="placeholder">—</span>`;
    }
  }));

  updateCounter();
}

// ---------- Restart frontend ----------
async function restartFrontend() {
  const url = api('/frontend/restart');
  restartBtn.disabled = true;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    const txt = await res.text().catch(()=> '');
    statusEl.innerHTML = `<span class="ok">🔁 Frontend redémarré avec succès</span> • ${new Date().toLocaleString()} • ${esc(url)} ${txt ? '• Réponse: '+esc(txt) : ''}`;
  } catch (err) {
    statusEl.innerHTML = `<span class="err">Erreur lors du redémarrage :</span> ${esc(err.message || err)}`;
  } finally {
    restartBtn.disabled = false;
  }
}
restartBtn.addEventListener('click', restartFrontend);

// ---------- Emulateurs ----------
async function loadEmulators(){
  try{
    const res = await fetch(api('/emulators'));
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const list = await res.json();

    emuSelect.innerHTML = list.map(e => {
      const label = e.name ?? e.safeName ?? e.type ?? ('ID ' + e.id);
      return `<option value="${esc(e.id)}">${esc(label)} (id ${esc(e.id)})</option>`;
    }).join('');

    if (prefs.emuId != null && [...emuSelect.options].some(o => String(o.value) === String(prefs.emuId))) {
      emuSelect.value = String(prefs.emuId);
    } else if (emuSelect.options.length) {
      prefs.emuId = emuSelect.value;
      savePrefs();
    }

  }catch(err){
    emuSelect.innerHTML = '';
    out.innerHTML = `<div class="err">Erreur chargement émulateurs : ${esc(err.message || err)}</div>`;
  }
}

// ---------- Tables ----------
async function loadGames(){
  const emuId = emuSelect.value;
  if(!emuId){ out.innerHTML = '<div class="muted">Aucun émulateur sélectionné.</div>'; return; }

  out.innerHTML = '<div class="muted">Chargement des tables…</div>';
  statusEl.textContent = '';

  try{
    const res = await fetch(api(`/games/knowns/${encodeURIComponent(emuId)}`));
    if(!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    const list = await res.json();

    allGames = Array.isArray(list) ? list.map(g => ({
      gameDisplayName: g.gameDisplayName ?? g.name ?? '',
      id: g.id
    })) : [];

    applySortFilter();
    renderTable();

    statusEl.innerHTML = `<span class="ok">OK</span> • ${new Date().toLocaleString()}`;
  }catch(err){
    out.innerHTML = `<div class="err">Erreur chargement tables : ${esc(err.message || err)}</div>`;
    statusEl.textContent = '';
  }
}

// ---------- Hooks + Mute / Unmute ----------
async function loadHooks() {
  try {
    const res = await fetch(api('/hooks'));
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    const data = await res.json();
    const items = Array.isArray(data?.hooks) ? data.hooks : [];

    // ✅ Génération des boutons de hooks
    const hookButtons = items.length
      ? items.map(h => {
          const label = h.endsWith('.bat') ? h.slice(0, -4) : h;
          return `<button class="hook-btn" data-hook="${esc(h)}">${esc(label)}</button>`;
        }).join('')
      : '<span class="muted">Aucun hook disponible</span>';

    // ✅ Ajout des boutons Mute / Unmute à la fin
    const extraButtons = `
      <button class="hook-btn mute" data-action="mute">Mute</button>
      <button class="hook-btn unmute" data-action="unmute">Unmute</button>
    `;

    hooksBar.innerHTML = hookButtons + extraButtons;

  } catch (err) {
    hooksBar.innerHTML = `<span class="err">Erreur chargement hooks : ${esc(err.message || err)}</span>`;
  }
}

// ---------- Mute / Unmute ----------
async function executeMute(state) {
  const url = api(`/system/mute/${state ? 1 : 0}`);
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    statusEl.innerHTML = `
      <span class="ok">✔ Son ${state ? 'coupé' : 'activé'}</span>
      • ${new Date().toLocaleString()}
      • ${esc(url)}
    `;
  } catch (err) {
    statusEl.innerHTML = `<span class="err">Erreur Mute :</span> ${esc(err.message || err)}`;
  }
}


// Délégation d'événement pour les boutons de hooks
if (hooksBar) {
  hooksBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.hook-btn');
    if (!btn) return;

    // 🔊 gestion des deux boutons Mute / Unmute
    const action = btn.dataset.action;
    if (action === 'mute' || action === 'unmute') {
      executeMute(action === 'mute');
      return;
    }

    const name = btn.getAttribute('data-hook') || '';
    if (name) executeHook(name, 0);
  });
}


// Exécuter un hook (POST /hooks)
async function executeHook(name, gameId = 0) {
  const payload = { name, commands: [], gameId };
  try {
    const res = await fetch(api('/hooks'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    const txt = await res.text().catch(()=>'');

    statusEl.innerHTML = `
      <span class="ok">✔ Hook exécuté</span>
      • ${new Date().toLocaleString()}
      • ${esc(name)}
      ${txt ? '• Réponse: ' + esc(txt) : ''}
    `;
  } catch (err) {
    statusEl.innerHTML = `<span class="err">Erreur Hook :</span> ${esc(err.message || err)}`;
  }
}

// ---------- Media ----------
async function ensureWheelForGame(gameId){
  const key = String(gameId);
  if (wheelCache.has(key)) return wheelCache.get(key);

  try {
    const res = await fetch(api(`/media/${encodeURIComponent(gameId)}`));
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    const root = await res.json();

    const wheelArr = Array.isArray(root?.media?.Wheel) ? root.media.Wheel : [];
    if (!wheelArr.length) { wheelCache.set(key, null); return null; }

    let entry = wheelArr.find(m => String(m?.mimeType || '').toLowerCase() === 'image/png');
    if (!entry) entry = wheelArr[0];

    if (entry && entry.name && entry.gameId != null) {
      const url = api(`/media/${encodeURIComponent(entry.gameId)}/Wheel/${encodeURIComponent(entry.name)}`);
      const info = { url, entry, media: root.media };
      wheelCache.set(key, info);
      return info;
    }
    wheelCache.set(key, null);
    return null;
  } catch (e) {
    wheelCache.set(key, null);
    return null;
  }
}

// ---------- Play (PUT {}) ----------
async function playGame(gameIdEncoded, btn){
  const url = api(`/games/play/${gameIdEncoded}`);
  btn.disabled = true;
  try{
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{}' // body vide
    });
    if(!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    const txt = await res.text().catch(()=> '');
    statusEl.innerHTML = `<span class="ok">✅ Table lancée (PUT)</span> • ${new Date().toLocaleString()} • ${esc(url)} ${txt ? '• Réponse: '+esc(txt) : ''}`;
    btn.textContent = "✅ Lancée";
    setTimeout(() => btn.textContent = "Jouer / Emulateur", 3000);
  }catch(err){
    statusEl.innerHTML = `<span class="err">Erreur Play :</span> ${esc(err.message || err)}`;
  }finally{
    btn.disabled = false;
  }
}
window.playGame = playGame;

// ---------- Launch via Frontend (GET /frontend/launch/<id>) ----------
async function launchFrontend(gameIdEncoded, btn){
  const url = api(`/frontend/launch/${gameIdEncoded}`);
  btn.disabled = true;
  try{
    const res = await fetch(url, { method: 'GET' });
    if(!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    const txt = await res.text().catch(()=> '');
    statusEl.innerHTML = `<span class="ok">🕹️ Lancement via Frontend (GET)</span> • ${new Date().toLocaleString()} • ${esc(url)} ${txt ? '• Réponse: '+esc(txt) : ''}`;
    btn.textContent = "✅ Envoyé";
    setTimeout(() => btn.textContent = "Jouer / Frontend", 3000);
  }catch(err){
    statusEl.innerHTML = `<span class="err">Erreur Frontend Launch :</span> ${esc(err.message || err)}`;
  }finally{
    btn.disabled = false;
  }
}
window.launchFrontend = launchFrontend;

// ---------- Modal ----------
function openModal()  {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  requestAnimationFrame(() => { modal.classList.add('visible'); });
}
function closeModal() {
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
modalClose1.addEventListener('click', closeModal);
modalClose2.addEventListener('click', closeModal);
modalBack  && modalBack.addEventListener('click', closeModal);
// Clic intérieur pour fermer (sauf éléments interactifs)
const modalCardClickArea = document.querySelector('.modal-card');
if (modalCardClickArea) {
  modalCardClickArea.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('button, a, input, select, textarea')) return;
    closeModal();
  });
}
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

// ---------- Fiche technique ----------
async function openDetails(gameId){
  try{
    modalTitle.textContent = 'Fiche technique';
    modalBody.innerHTML = `<div class="kmuted">Chargement…</div>`;
    openModal();

    const url = api(`/frontend/tabledetails/${encodeURIComponent(gameId)}`);
    const res = await fetch(url);
    if(!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    const d = await res.json();

    const fmtDate = ms => ms ? new Date(ms).toLocaleString() : '—';
    const listChips = (arr) => Array.isArray(arr) && arr.length
      ? `<div class="kchips">${arr.map(x=>`<span class="kchip">${esc(x)}</span>`).join('')}</div>` : '—';
    const splitCSV = (s) => (typeof s === 'string' && s.trim()) ? s.split(',').map(x=>x.trim()).filter(Boolean) : [];
    const safe = v => (v === null || v === undefined || v === '') ? '—' : esc(v);

    const title = d.gameDisplayName || d.gameName || '(sans nom)';
    modalTitle.textContent = title;

    // Wheel titre + fond dynamique
    const wheelImg  = document.getElementById('modal-wheel');
    const modalCard = document.querySelector('.modal-card');
    if (wheelImg) {
      wheelImg.src = ''; wheelImg.style.display = 'none';
      ensureWheelForGame(gameId).then(info => {
        if (info && info.url) {
          wheelImg.src = info.url; wheelImg.style.display = 'block';
          if (modalCard) modalCard.style.setProperty('--modal-bg', `url("${info.url}")`);
        } else {
          if (modalCard) modalCard.style.removeProperty('--modal-bg');
        }
      });
    }

    const launchers = Array.isArray(d.launcherList) ? d.launcherList : [];
    const themes    = splitCSV(d.gameTheme);
    const tags      = splitCSV(d.tags).map(t=>t.replace(/^,+/,''));
    const linkMain  = d.url ? `<a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.url)}</a>` : '—';
    const link2     = d.webLink2Url ? `<a href="${esc(d.webLink2Url)}" target="_blank" rel="noopener">${esc(d.webLink2Url)}</a>` : '—';

    modalBody.innerHTML = `
      <dl class="kv">
        <dt>Nom</dt><dd>${esc(title)}</dd>
        <dt>Fichier</dt><dd class="kmono">${safe(d.gameFileName)}</dd>
        <dt>Fabricant</dt><dd>${safe(d.manufacturer)}</dd>
        <dt>Année</dt><dd>${safe(d.gameYear)}</dd>
        <dt>Version</dt><dd>${safe(d.gameVersion)}</dd>
        <dt>Concepteur</dt><dd>${safe(d.designedBy)}</dd>
        <dt>Auteurs</dt><dd>${safe(d.author)}</dd>
        <dt>Thèmes</dt><dd>${themes.length ? listChips(themes) : '—'}</dd>
        <dt>Tags</dt><dd>${tags.length ? listChips(tags) : '—'}</dd>
        <dt>Joueurs</dt><dd>${safe(d.numberOfPlayers)}</dd>
        <dt>Parties jouées</dt><dd>${safe(d.numberPlays)}</dd>
        <dt>Dernière partie</dt><dd>${fmtDate(d.lastPlayed)}</dd>
        <dt>Ajouté le</dt><dd>${fmtDate(d.dateAdded)}</dd>
        <dt>Modifié le</dt><dd>${fmtDate(d.dateModified)}</dd>
        <dt>ROM</dt><dd class="kmono">${safe(d.romName || d.romAlt)}</dd>
        <dt>IPDB</dt><dd>${d.ipdbnum ? `<a href="https://www.ipdb.org/machine.cgi?id=${esc(d.ipdbnum)}" target="_blank" rel="noopener">${esc(d.ipdbnum)}</a>` : '—'}</dd>
        <dt>Lien</dt><dd>${linkMain}</dd>
        <dt>Lien 2</dt><dd>${link2}</dd>
        <dt>Lanceurs</dt><dd>${launchers.length ? listChips(launchers) : '—'}</dd>
        <dt>Notes</dt><dd class="kblock">${safe(d.gDetails || d.gNotes || d.notes)}</dd>
      </dl>
    `;
  } catch(err){
    modalBody.innerHTML = `<div class="err">Erreur chargement fiche : ${esc(err.message || err)}</div>`;
  }
}

// ---------- Events ----------
refreshBtn.addEventListener('click', async ()=>{
  refreshBtn.disabled = true;
  prefs.base = baseInput.value.trim() || prefs.base;
  prefs.emuId = emuSelect.value || prefs.emuId;
  savePrefs();

  await loadEmulators();
  if (prefs.emuId && [...emuSelect.options].some(o => String(o.value) === String(prefs.emuId))) {
    emuSelect.value = String(prefs.emuId);
  }
  await loadHooks();
  await loadGames();
  refreshBtn.disabled = false;
});

searchInput.addEventListener('input', () => {
  prefs.search = searchInput.value;
  savePrefs();
  applySortFilter();
  renderTable();
});

baseInput.addEventListener('change', async () => {
  prefs.base = baseInput.value.trim();
  savePrefs();
  await loadHooks(); // recharger les hooks si la base change
});
emuSelect.addEventListener('change', async () => {
  prefs.emuId = emuSelect.value;
  savePrefs();
  await loadGames();
});

// ---------- init ----------
(async () => {
  loadPrefs();
  applyPrefsToUI();

  if (prefs.base) baseInput.value = prefs.base;

  await loadEmulators();

  if (prefs.emuId && [...emuSelect.options].some(o => String(o.value) === String(prefs.emuId))) {
    emuSelect.value = String(prefs.emuId);
  }

  await loadHooks();
  await loadGames();

  applySortFilter();
  renderTable();
})();
