export const esc = s => String(s).replace(/[&<>"]/g, c => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]
));

export const api = (base, path) =>
  base.trim().replace(/\/+$/,'') + (path.startsWith('/') ? path : '/' + path);

const LS_KEY = 'vpinstudio.prefs';
export const loadPrefs = (defaults) => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...defaults };
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return { ...defaults };
    return {
      ...defaults,
      ...obj,
      sort: obj.sort && typeof obj.sort === 'object'
        ? { key: obj.sort.key || 'index', dir: obj.sort.dir === -1 ? -1 : 1 }
        : { key: 'index', dir: 1 }
    };
  } catch { return { ...defaults }; }
};
export const savePrefs = (prefs) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)); } catch {}
};

export async function fetchJSON(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}
export async function fetchTEXT(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.text().catch(()=> '');
}
export async function fetchBLOB(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.blob();
}
