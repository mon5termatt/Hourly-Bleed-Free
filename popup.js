// The "social" slice of the bleed list. Only domains that are also in bleedDomains count toward it.
const SOCIAL_DOMAINS = ["x.com", "twitter.com", "reddit.com", "instagram.com", "tiktok.com", "facebook.com", "threads.net"];

const $ = id => document.getElementById(id);
const money = n => `$${(n || 0).toFixed(2)}`;
const matches = (host, d) => host === d || host.endsWith("." + d);

function dateKey(d = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function dayLabel(key) {
  const today = dateKey();
  const yesterday = dateKey(new Date(Date.now() - 86400e3));
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

const dayTotal = (day = {}) => Object.values(day).reduce((sum, s) => sum + s.cost, 0);

async function render() {
  const { history = {}, hourlyRate = 0, bleedDomains = [] } =
    await chrome.storage.local.get(["history", "hourlyRate", "bleedDomains"]);
  const today = history[dateKey()] || {};
  const entries = Object.entries(today);

  $("total").textContent = money(dayTotal(today));
  $("rate").textContent = `at $${hourlyRate}/hr`;

  const social = SOCIAL_DOMAINS.filter(d => bleedDomains.includes(d));
  const socialTax = entries
    .filter(([host]) => social.some(d => matches(host, d)))
    .reduce((sum, [, s]) => sum + s.cost, 0);
  $("social").textContent = money(socialTax);

  const top = entries.sort((a, b) => b[1].cost - a[1].cost).slice(0, 5);
  const list = $("top");
  list.replaceChildren(...top.map(([host, s]) => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.className = "domain";
    name.textContent = host;
    const amt = document.createElement("span");
    amt.className = "amount";
    amt.textContent = money(s.cost);
    li.append(name, amt);
    return li;
  }));
  $("empty").hidden = top.length > 0;

  const rows = [];
  for (let i = 0; i < 7; i++) {
    const key = dateKey(new Date(Date.now() - i * 86400e3));
    const day = history[key];
    if (day && Object.keys(day).length) rows.push([key, dayTotal(day)]);
  }
  $("history").replaceChildren(...rows.map(([key, total]) => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.className = "domain";
    name.textContent = dayLabel(key);
    const amt = document.createElement("span");
    amt.className = "amount";
    amt.textContent = money(total);
    li.append(name, amt);
    return li;
  }));
  $("historyEmpty").hidden = rows.length > 0;
}

$("reset").addEventListener("click", async () => {
  const { history = {} } = await chrome.storage.local.get("history");
  delete history[dateKey()];
  await chrome.storage.local.set({ history });
  chrome.action.setBadgeText({ text: "" });
});

$("options").addEventListener("click", e => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

chrome.storage.onChanged.addListener((changes, area) => { if (area === "local") render(); });
render();
