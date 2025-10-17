import { getMedia, apiUrl } from './api.js';
import { state } from './state.js';

export async function ensureWheelForGame(gameId){
  const key = String(gameId);
  if (state.wheelCache.has(key)) return state.wheelCache.get(key);
  try {
    const root = await getMedia(gameId);
    const wheelArr = Array.isArray(root?.media?.Wheel) ? root.media.Wheel : [];
    if (!wheelArr.length) { state.wheelCache.set(key, null); return null; }

    let entry = wheelArr.find(m => String(m?.mimeType||'').toLowerCase()==='image/png');
    if (!entry) entry = wheelArr[0];

    if (entry && entry.name && entry.gameId != null) {
      const url = apiUrl(`/media/${encodeURIComponent(entry.gameId)}/Wheel/${encodeURIComponent(entry.name)}`);
      const info = { url, entry, media: root.media };
      state.wheelCache.set(key, info);
      return info;
    }
    state.wheelCache.set(key, null);
    return null;
  } catch {
    state.wheelCache.set(key, null);
    return null;
  }
}
