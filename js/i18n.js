// js/i18n.js
export const messages = {
  en: {
    title: "VPinStudio Tables Manager",
    baseApi: "Base API",
    emulator: "Emulator",
    refresh: "Refresh",
    search: "Search a table or ID…",
    restartGeneric: "🔁 Restart Frontend",
    restartWithName: "🔁 Restart {name}",
    noTables: "No tables to display.",
    loadingTables: "Loading tables…",
    // Table headers
    thHash: "#",
    thTable: "Table",
    thId: "ID",
    thAction: "Action",
    // Buttons in table
    playEmu: "Play / Emulator",
    playFrontend: "Play / Frontend",
    // Hooks / system
    mute: "Mute",
    unmute: "Unmute",
    updates: "⬆️ Updates",
    updatesTitle: "Installed components",
    installedVersion: "Installed Version",
    latestReleaseVersion: "Latest Released Version",
    githubUrl: "Github URL",
    notInstalled: "Not installed",
    upToDate: "Up to date",
    updateAvailable: "Update available",
    noComponents: "No components to display.",
    // Modal
    techSheet: "Technical sheet",
    mName: "Name",
    mFile: "File",
    mManufacturer: "Manufacturer",
    mYear: "Year",
    mVersion: "Version",
    mDesigner: "Designer",
    mAuthors: "Authors",
    mThemes: "Themes",
    mTags: "Tags",
    mPlayers: "Players",
    mPlays: "Plays",
    mLastPlayed: "Last played",
    mAdded: "Added",
    mModified: "Modified",
    mROM: "ROM",
    mIPDB: "IPDB",
    mLink: "Link",
    mLink2: "Link 2",
    mLaunchers: "Launchers",
    mNotes: "Notes",
    close: "Close",
	activeGameGeneric: "🎮 Active: —",
	activeGameWithName: "🎮 Active: {name}",
	activeGameNone: "🎮 Active: none",
	lastGameWithName: "🎮 Last: {name}",
	viewList: "List",
	viewGrid: "Thumbnails"
  },
  fr: {
    title: "Gestion des Tables VpinStudio",
    baseApi: "Base API",
    emulator: "Émulateur",
    refresh: "Actualiser",
    search: "Rechercher une table ou un ID…",
    restartGeneric: "🔁 Redémarrer le Frontend",
    restartWithName: "🔁 Redémarrer {name}",
    noTables: "Aucune table à afficher.",
    loadingTables: "Chargement des tables…",
    // Entêtes du tableau
    thHash: "#",
    thTable: "Table",
    thId: "ID",
    thAction: "Action",
    // Boutons de ligne
    playEmu: "Jouer / Emulateur",
    playFrontend: "Jouer / Frontend",
    // Hooks / système
    mute: "Muet",
    unmute: "Son",
    updates: "⬆️ Updates",
    updatesTitle: "Logiciels installés",
    installedVersion: "Version installée",
    latestReleaseVersion: "Dernière version publiée",
    githubUrl: "URL Github",
    notInstalled: "Non installé",
    upToDate: "À jour",
    updateAvailable: "Mise à jour disponible",
    noComponents: "Aucun composant à afficher.",
    // Modal
    techSheet: "Fiche technique",
    mName: "Nom",
    mFile: "Fichier",
    mManufacturer: "Fabricant",
    mYear: "Année",
    mVersion: "Version",
    mDesigner: "Concepteur",
    mAuthors: "Auteurs",
    mThemes: "Thèmes",
    mTags: "Tags",
    mPlayers: "Joueurs",
    mPlays: "Parties jouées",
    mLastPlayed: "Dernière partie",
    mAdded: "Ajouté le",
    mModified: "Modifié le",
    mROM: "ROM",
    mIPDB: "IPDB",
    mLink: "Lien",
    mLink2: "Lien 2",
    mLaunchers: "Lanceurs",
    mNotes: "Notes",
    close: "Fermer",
	activeGameGeneric: "🎮 Actif : —",
	activeGameWithName: "🎮 Actif : {name}",
	activeGameNone: "🎮 Actif : aucune",
	lastGameWithName: "🎮 Dernière : {name}",
	viewList: "Liste",
  viewGrid: "Miniatures"
  }
};

let current = 'fr';

export function setLang(lang) {
  current = (lang === 'en' ? 'en' : 'fr');
  document.documentElement.lang = current;
}
export function getLang() { return current; }

export function t(key, vars = {}) {
  const dict = messages[current] || messages.en;
  const s = dict[key] ?? messages.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

/** Applique les traductions aux éléments marqués dans le DOM */
export function applyI18nToDOM() {
  // textContent
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    el.textContent = t(key);
  });
  // placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key) return;
    el.setAttribute('placeholder', t(key));
  });
  // aria-label
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    if (!key) return;
    el.setAttribute('aria-label', t(key));
  });
}
