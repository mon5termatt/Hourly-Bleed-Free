const DEFAULTS = {
  hourlyRate: 85,
  bleedDomains: [
    "x.com",
    "twitter.com",
    "reddit.com",
    "youtube.com",
    "instagram.com",
    "tiktok.com",
    "news.ycombinator.com"
  ],
  history: {}
};

function dateKey(d = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function pruneHistory(history) {
  const cutoff = dateKey(new Date(Date.now() - 6 * 86400e3));
  for (const k of Object.keys(history)) if (k < cutoff) delete history[k];
  return history;
}

function dayTotal(day = {}) {
  return Object.values(day).reduce((sum, s) => sum + s.cost, 0);
}

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(Object.keys(DEFAULTS));
  const missing = Object.fromEntries(
    Object.entries(DEFAULTS).filter(([k]) => existing[k] === undefined)
  );
  if (Object.keys(missing).length) await chrome.storage.local.set(missing);
});

let activeDomain = null;
let startTs = null;

const MAX_GAP_SECONDS = 90;
const ready = chrome.storage.session.get(["activeDomain", "startTs"]).then(s => {
  activeDomain = s.activeDomain ?? null;
  startTs = s.startTs ?? null;
});

function track(domain) {
  activeDomain = domain;
  startTs = Date.now();
  return chrome.storage.session.set({ activeDomain, startTs });
}

function restartClock() {
  startTs = Date.now();
  return chrome.storage.session.set({ startTs });
}

function matchesDomain(host, d) {
  return host === d || host.endsWith("." + d);
}

function hostOf(url) {
  try { return new URL(url || "about:blank").hostname.replace(/^www\./, ""); }
  catch { return ""; }
}

async function isActive() {
  const state = await chrome.idle.queryState(60);
  if (state !== "active") return false;
  const win = await chrome.windows.getLastFocused({ populate: false });
  return win && win.focused;
}

async function updateBadge() {
  const { history = {} } = await chrome.storage.local.get("history");
  const total = dayTotal(history[dateKey()]);
  await chrome.action.setBadgeText({ text: total > 0 ? `$${Math.round(total)}` : "" });
  await chrome.action.setBadgeBackgroundColor({ color: total > 40 ? "#c00" : "#333" });
}

async function flush() {
  await ready;
  if (!activeDomain || !startTs) return;
  if (!(await isActive())) {
    await restartClock();
    return;
  }
  const elapsed = (Date.now() - startTs) / 1000;
  await restartClock();
  if (elapsed <= 0 || elapsed > MAX_GAP_SECONDS) return;

  const data = await chrome.storage.local.get(["hourlyRate", "bleedDomains", "history"]);
  const history = data.history || {};
  if (data.bleedDomains.some(d => matchesDomain(activeDomain, d))) {
    const key = dateKey();
    const day = history[key] || {};
    const s = day[activeDomain] || { seconds: 0, cost: 0 };
    s.seconds += elapsed;
    s.cost += (elapsed / 3600) * data.hourlyRate;
    day[activeDomain] = s;
    history[key] = day;
    await chrome.storage.local.set({ history: pruneHistory(history) });
  }
  await updateBadge();
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await flush();
  const tab = await chrome.tabs.get(tabId);
  await track(hostOf(tab.url));
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url || !tab.active) return;
  const win = await chrome.windows.getLastFocused({ populate: false });
  if (!win || win.id !== tab.windowId) return;
  await flush();
  await track(hostOf(changeInfo.url));
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await flush();
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await track(null);
    return;
  }
  try {
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    await track(hostOf(tab?.url));
  } catch {
    await track(null);
  }
});

chrome.alarms.create("tick", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(flush);
