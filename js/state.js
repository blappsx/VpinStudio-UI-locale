import { DEFAULT_BASE } from './config.js';
import { loadPrefs } from './utils.js';

export const state = {
  prefs: loadPrefs({
    base: 'http://192.168.0.5:8089/api/v1',
    emuId: null,
    search: '',
    sort: { key: 'index', dir: 1 },
    lang: 'fr'               // <-- ajouté
  }),
  // données en mémoire
  wheelCache: new Map(),
  allGames: [],
  filteredGames: [],

  // refs DOM (remplies par initDOM)
  dom: {}
};

export function initDOM() {
  state.dom = {
    baseInput  : document.getElementById('base'),
    emuSelect  : document.getElementById('emu'),
    refreshBtn : document.getElementById('refresh'),
    out        : document.getElementById('out'),
    statusEl   : document.getElementById('status'),
    restartBtn : document.getElementById('restart'),
    searchInput: document.getElementById('search'),
    counterEl  : document.getElementById('counter'),
    hooksBar   : document.getElementById('hooksBar'),
    // modal
    modal      : document.getElementById('modal'),
    modalClose1: document.getElementById('modal-close'),
    modalClose2: document.getElementById('modal-close-2'),
    modalBack  : document.getElementById('modal-backdrop'),
    modalBody  : document.getElementById('modal-body'),
    modalTitle : document.getElementById('modal-title'),
	//langue
	langSelect : document.getElementById('lang'),
  };
}