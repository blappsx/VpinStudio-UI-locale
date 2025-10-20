import { api, fetchJSON, fetchTEXT } from './utils.js';
import { state } from './state.js';
import { fetchBLOB } from './utils.js'; // en haut si pas encore importé

const base = () => state.prefs.base;

export const getEmulators = () => fetchJSON(api(base(), '/emulators'));
export const getGamesKnowns = (emuId) => fetchJSON(api(base(), `/games/knowns/${encodeURIComponent(emuId)}`));
// PUT /games/play/:id  — lance une table, avec options facultatives
export const putPlayGame = (gameId, payload = {}) =>
  fetchTEXT(api(base(), `/games/play/${encodeURIComponent(gameId)}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload) // ex. { altExe: "VPinballX64.exe", option: "..." }
  });

// (facultatif) petit helper
export const playWithAltExe = (gameId, altExe, option) =>
  putPlayGame(gameId, option ? { altExe, option } : { altExe });
  
export const getFrontendLaunch = (gameId) =>
  fetchTEXT(api(base(), `/frontend/launch/${encodeURIComponent(gameId)}`));
export const getTableDetails = (gameId) =>
  fetchJSON(api(base(), `/frontend/tabledetails/${encodeURIComponent(gameId)}`));
export const getMedia = (gameId) =>
  fetchJSON(api(base(), `/media/${encodeURIComponent(gameId)}`));
export const getRestart = () =>
  fetchTEXT(api(base(), '/frontend/restart'));
export const getHooks = () =>
  fetchJSON(api(base(), '/hooks'));
export const postHook = (name, gameId=0) =>
  fetchTEXT(api(base(), '/hooks'), {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ name, commands:[], gameId })
  });
export const getMute = (flag) =>
  fetchTEXT(api(base(), `/system/mute/${flag ? 1 : 0}`));
export const apiUrl = (path) => api(base(), path);

export const getSystem = () =>
  fetchJSON(api(base(), '/system'));

export const getAvatar = () =>
  fetchBLOB(api(base(), '/assets/avatar'));
// Récupère les infos du frontend (nom, exe, etc.)
export const getFrontendInfo = () =>
  fetchJSON(api(base(), '/frontend'));

// Récupère les highscores d'une table
export const getHighscores = (gameId) =>
  fetchJSON(api(base(), `/games/scores/${gameId}`));