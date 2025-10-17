import { state } from './state.js';
import { esc } from './utils.js';
import { getHooks, postHook, getMute } from './api.js';

export async function loadHooksUI() {
  const { hooksBar } = state.dom;
  try {
    const data = await getHooks();
    const items = Array.isArray(data?.hooks) ? data.hooks : [];

    const hookButtons = items.length
      ? items.map(h => {
          const label = h.endsWith('.bat') ? h.slice(0, -4) : h;
          return `<button class="hook-btn" data-hook="${esc(h)}">${esc(label)}</button>`;
        }).join('')
      : '<span class="muted">Aucun hook disponible</span>';

    const extra = `
      <button class="hook-btn mute" data-action="mute">Mute</button>
      <button class="hook-btn unmute" data-action="unmute">Unmute</button>
    `;

    hooksBar.innerHTML = hookButtons + extra;

  } catch (err) {
    hooksBar.innerHTML = `<span class="err">Erreur hooks : ${esc(err.message||err)}</span>`;
  }
}

export function wireHooksBar() {
  const { hooksBar, statusEl } = state.dom;
  hooksBar.addEventListener('click', async (e) => {
    const btn = e.target.closest('.hook-btn');
    if (!btn) return;

    const action = btn.dataset.action;
    try {
      if (action === 'mute' || action === 'unmute') {
        const txt = await getMute(action === 'mute');
        statusEl.innerHTML = `<span class="ok">✔ Son ${action==='mute'?'coupé':'activé'}</span> • ${new Date().toLocaleString()}`;
        return;
      }
      const name = btn.getAttribute('data-hook') || '';
      if (name) {
        const txt = await postHook(name, 0);
        statusEl.innerHTML = `<span class="ok">✔ Hook exécuté</span> • ${new Date().toLocaleString()} • ${esc(name)}`;
      }
    } catch (err) {
      statusEl.innerHTML = `<span class="err">Erreur Hook :</span> ${esc(err.message||err)}`;
    }
  });
}
