/**
 * ============================================================================
 *  VpinStudio – UI locale (HTML/CSS/JS)
 *  Fichier : js/main.js (point d’entrée ES modules)
 * ----------------------------------------------------------------------------
 *  Rôle de main.js :
 *    - Initialiser l’application et appliquer les préférences persistées
 *    - Brancher les événements globaux (header, table, langue, contrôles)
 *    - Coordonner les chargements asynchrones (system, hooks, émulateurs, tables)
 *    - Orchestrer le rendu principal (tri/filtre, table, compteur, statut)
 *
 *  Auteur(s) / crédits :
 *    - Développement & intégration UI : Cédric Blap / ChatGPT
 *    - Backend & API : projet open source VPin Studio
 *      https://github.com/syd711/vpin-studio
 *    - Thanks to Syd711 and leprinco
 *
 *  Version UI courante :
 *    - v2.0.0-beta.2 – 2026-04-23 – Branche beta 2.0 (documentation + runtime version)
 *
 *  Configuration par défaut :
 *    - Base API : http://192.168.0.5:8089/api/v1 (modifiable dans l’interface)
 *
 *  Endpoints utilisés (directement ou via api.js) :
 *    - GET    /emulators
 *    - GET    /games/knowns/<emuId>
 *    - PUT    /games/play/<gameId>               (body: {})
 *    - GET    /frontend/launch/<gameId>
 *    - GET    /frontend/tabledetails/<gameId>
 *    - GET    /media/<gameId>                    (liste des médias)
 *    - GET    /media/<gameId>/Wheel/<name>       (image Wheel)
 *    - GET    /frontend/restart
 *    - GET    /system/mute/1                     (Mute)
 *    - GET    /system/mute/0                     (Unmute)
 *    - GET    /hooks                             (liste des hooks)
 *    - POST   /hooks                             (exécuter un hook)
 *    - GET    /system                            (systemName, version)
 *    - GET    /assets/avatar                     (PNG avatar du cab)
 *    - GET    /frontend                          (infos frontend, ex. name)
 *
 *  Fonctionnalités UI couvertes :
 *    - Thème sombre (Inter), responsive desktop/mobile
 *    - Tableau triable, recherche en direct, compteur dynamique
 *    - Lignes cliquables → modal fiche technique (fond flou depuis la Wheel)
 *    - Barre de hooks (boutons dynamiques) + Mute/Unmute
 *    - Avatar + nom système + version VPinStudio dans l’en-tête
 *    - Libellé du bouton Restart basé sur le nom du frontend
 *    - Infos de partie active (inline) mises à jour périodiquement
 *    - Bascule de vue (liste/grille) + panneau contrôles repliable
 *    - Modale de composants/mises à jour
 *    - Préférences persistées (localStorage) : base, émulateur, tri, filtre, langue, vue
 *
 *  Modules :
 *    - config.js   : constantes par défaut
 *    - utils.js    : helpers (esc, fetchJSON/TEXT/BLOB, storage)
 *    - state.js    : état global + refs DOM
 *    - api.js      : appels REST vers l’API VPin Studio
 *    - media.js    : résolution & cache des médias (Wheel)
 *    - modal.js    : fiche technique (ouverture/fermeture/rendu)
 *    - table.js    : tri/filtre/rendu de la liste des tables
 *    - hooks.js    : barre de hooks, mute/unmute
 *    - header.js   : avatar + systemName + version
 *    - frontend.js : libellés frontend + partie active
 *    - components.js: modale des composants (versions/installés/updates)
 *    - i18n.js     : gestion de la traduction
 *
 *  Licence :
 *    - MIT License
 * ============================================================================
 */
import { state, initDOM } from './state.js';
import { savePrefs } from './utils.js';
import { getEmulators, getGamesKnowns, getRestart, putPlayGame, getFrontendLaunch } from './api.js';
import { applySortFilter, renderTable, updateCounter } from './table.js';
import { wireModalClose, openDetails } from './modal.js';
import { loadHooksUI, wireHooksBar } from './hooks.js';
import { loadSystemHeader } from './header.js';
import { updateRestartButtonLabel, updateActiveGameButtonLabel, updateActiveGameInline } from './frontend.js';
import { setLang, applyI18nToDOM } from './i18n.js';
import { openComponentsModal } from './components.js';


const UI_VERSION = '2.0.0-beta.2';
const UI_VERSION_DATE = '2026-04-23';

function applyPrefsToUI() {
	const { baseInput, searchInput, controlsToggle, controlsBody } = state.dom;

	if (baseInput && state.prefs.base) baseInput.value = state.prefs.base;
	if (searchInput) searchInput.value = state.prefs.search || '';
	const { viewToggle } = state.dom;

	if (viewToggle) {
	  viewToggle.querySelectorAll('.view-btn').forEach(btn => {
		btn.classList.toggle(
		  'active',
		  btn.dataset.view === (state.prefs.viewMode || 'list')
		);
	  });
	}

	if (controlsToggle && controlsBody) {
	  const collapsed = !!state.prefs.controlsCollapsed;
	  controlsBody.hidden = collapsed;
	  controlsToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
	  controlsToggle.classList.toggle('is-collapsed', collapsed);
	}
}

async function loadEmulatorsUI() {
  const { emuSelect, out } = state.dom;
  try {
    const list = await getEmulators();
    emuSelect.innerHTML = list.map(e => {
      const label = e.name ?? e.safeName ?? e.type ?? ('ID ' + e.id);
      return `<option value="${e.id}">${label} (id ${e.id})</option>`;
    }).join('');
    if (state.prefs.emuId != null && [...emuSelect.options].some(o => String(o.value)===String(state.prefs.emuId))) {
      emuSelect.value = String(state.prefs.emuId);
    } else if (emuSelect.options.length) {
      state.prefs.emuId = emuSelect.value;
      savePrefs(state.prefs);
    }
  } catch (err) {
    emuSelect.innerHTML = '';
    out.innerHTML = `<div class="err">Error loading emulators: ${err.message||err}</div>`;
  }
}

async function loadGamesUI() {
  const { emuSelect, out, statusEl } = state.dom;
  const emuId = emuSelect.value;
  if (!emuId) { out.innerHTML = '<div class="muted">Aucun émulateur sélectionné.</div>'; return; }
  out.innerHTML = '<div class="muted">Chargement des tables…</div>'; statusEl.textContent = '';
  try {
    const list = await getGamesKnowns(emuId);
    state.allGames = Array.isArray(list) ? list.map(g => ({
      gameDisplayName: g.gameDisplayName ?? g.name ?? '',
      id: g.id
    })) : [];
    applySortFilter(); renderTable();
    statusEl.innerHTML = `<span class="ok">OK</span> • ${new Date().toLocaleString()}`;
  } catch (err) {
    out.innerHTML = `<div class="err">Erreur chargement tables : ${err.message||err}</div>`;
    statusEl.textContent = '';
  }
}

// Actions boutons dans la table (délégation)
function wireTableActions() {
  const { out, statusEl } = state.dom;
  out.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.disabled = true;
    try {
      if (action === 'play') {
        const txt = await putPlayGame(id);
        statusEl.innerHTML = `<span class="ok">✅ Table lancée (PUT)</span> • ${new Date().toLocaleString()}`;
        btn.textContent = "✅ Lancée"; setTimeout(()=> btn.textContent="Jouer / Emulateur", 3000);
      } else if (action === 'launch') {
        const txt = await getFrontendLaunch(id);
        statusEl.innerHTML = `<span class="ok">🕹️ Lancement via Frontend (GET)</span> • ${new Date().toLocaleString()}`;
        btn.textContent = "✅ Envoyé"; setTimeout(()=> btn.textContent="Jouer / Frontend", 3000);
      }
    } catch (err) {
      statusEl.innerHTML = `<span class="err">Erreur action :</span> ${err.message||err}`;
    } finally {
      btn.disabled = false;
    }
  });
}

function wireHeader() {
  const {
    refreshBtn,
    baseInput,
    emuSelect,
    searchInput,
    restartBtn,
    activeGameInline,
    updatesBtn,
    statusEl,
	viewSelect,
	controlsToggle,
	controlsBody
  } = state.dom;

  refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    state.prefs.base = baseInput.value.trim() || state.prefs.base;
    state.prefs.emuId = emuSelect.value || state.prefs.emuId;
    savePrefs(state.prefs);

    await loadSystemHeader();
    await loadEmulatorsUI();
    await updateRestartButtonLabel();
    await updateActiveGameInline();

    if (state.prefs.emuId && [...emuSelect.options].some(o => String(o.value) === String(state.prefs.emuId))) {
      emuSelect.value = String(state.prefs.emuId);
    }

    await loadHooksUI();
    await loadGamesUI();
    refreshBtn.disabled = false;
  });

  baseInput.addEventListener('change', async () => {
    state.prefs.base = baseInput.value.trim();
    savePrefs(state.prefs);

    await loadHooksUI();
    await loadSystemHeader();
    await updateRestartButtonLabel();
    await updateActiveGameInline();
  });

  emuSelect.addEventListener('change', async () => {
    state.prefs.emuId = emuSelect.value;
    savePrefs(state.prefs);
    await loadGamesUI();
  });

  searchInput.addEventListener('input', () => {
    state.prefs.search = searchInput.value;
    savePrefs(state.prefs);
    applySortFilter();
    renderTable();
    updateCounter();
  });

  restartBtn.addEventListener('click', async () => {
    restartBtn.disabled = true;
    try {
      await getRestart();
      statusEl.innerHTML = `<span class="ok">🔁 Frontend redémarré</span> • ${new Date().toLocaleString()}`;
    } catch (err) {
      statusEl.innerHTML = `<span class="err">Erreur restart :</span> ${err.message || err}`;
    } finally {
      restartBtn.disabled = false;
    }
  });

  if (activeGameInline) {
    activeGameInline.addEventListener('click', async () => {
      const id = activeGameInline.dataset.gameid;
      if (!id) return;
      await openDetails(id);
    });
  }

	if (updatesBtn) {
		updatesBtn.addEventListener('click', async () => {
		  await openComponentsModal();
		});
	}
	if (controlsToggle && controlsBody) {
	  controlsToggle.addEventListener('click', () => {
		const collapsed = !controlsBody.hidden;
		controlsBody.hidden = collapsed;

		controlsToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
		controlsToggle.classList.toggle('is-collapsed', collapsed);

		state.prefs.controlsCollapsed = collapsed;
		savePrefs(state.prefs);
	  });
	}
	if (viewSelect) {
		viewSelect.addEventListener('change', () => {
			state.prefs.viewMode = viewSelect.value || 'list';
			savePrefs(state.prefs);
			renderTable();
			updateCounter();
		});
	}
	const { viewToggle } = state.dom;

	if (viewToggle) {
	  viewToggle.addEventListener('click', (e) => {
		const btn = e.target.closest('.view-btn');
		if (!btn) return;

		const mode = btn.dataset.view;
		if (!mode) return;

		state.prefs.viewMode = mode;
		savePrefs(state.prefs);

		// UI active
		viewToggle.querySelectorAll('.view-btn').forEach(b =>
		  b.classList.toggle('active', b === btn)
		);

		renderTable();
		updateCounter();
	  });
	}
}

// ---------- BOOT ----------
(async function boot() {
  initDOM();
  document.body?.setAttribute('data-ui-version', UI_VERSION);
  console.info(`[VpinStudio UI] version ${UI_VERSION} (${UI_VERSION_DATE})`);

  setLang(state.prefs.lang || 'fr');
  applyI18nToDOM();

  if (state.dom.langSelect) {
    state.dom.langSelect.value = state.prefs.lang || 'fr';
  }

  applyPrefsToUI();

  await loadSystemHeader();
  await updateRestartButtonLabel();
  await updateActiveGameInline();

  wireModalClose();
  wireHooksBar();
  wireTableActions();
  wireHeader();

  if (state.dom.langSelect) {
    state.dom.langSelect.addEventListener('change', async () => {
      state.prefs.lang = state.dom.langSelect.value;
      savePrefs(state.prefs);
      setLang(state.prefs.lang);
      applyI18nToDOM();

      await updateRestartButtonLabel();
      await updateActiveGameInline();

      applySortFilter();
      renderTable();
    });
  }

  await loadEmulatorsUI();

  if (state.prefs.emuId && [...state.dom.emuSelect.options].some(o => String(o.value) === String(state.prefs.emuId))) {
    state.dom.emuSelect.value = String(state.prefs.emuId);
  }

  await loadHooksUI();
  await loadGamesUI();
  applySortFilter();
  renderTable();
  
	setInterval(() => {
		updateActiveGameInline();
	}, 30000);
})();
