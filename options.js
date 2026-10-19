const $ = id => document.getElementById(id);

function status(id, text, kind = "") {
  const el = $(id);
  el.textContent = text;
  el.className = `status ${kind}`;
}

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

// Accepts "https://www.reddit.com/r/foo", "Reddit.com ", etc. Returns a bare hostname or null.
function cleanDomain(raw) {
  let s = String(raw || "").trim().toLowerCase();
  if (!s) return null;
  try { s = new URL(s.includes("://") ? s : `https://${s}`).hostname; } catch { return null; }
  s = s.replace(/^www\./, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s) ? s : null;
}

async function renderDomains() {
  const { bleedDomains = [] } = await chrome.storage.local.get("bleedDomains");
  $("domains").replaceChildren(...bleedDomains.map(d => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = d;
    const rm = document.createElement("button");
    rm.type = "button";
    rm.textContent = "Remove";
    rm.addEventListener("click", async () => {
      const { bleedDomains: cur = [] } = await chrome.storage.local.get("bleedDomains");
      await chrome.storage.local.set({ bleedDomains: cur.filter(x => x !== d) });
    });
    li.append(name, rm);
    return li;
  }));
}

async function renderHistory() {
  const { history = {} } = await chrome.storage.local.get("history");
  const rows = [];
  for (let i = 0; i < 7; i++) {
    const key = dateKey(new Date(Date.now() - i * 86400e3));
    const day = history[key];
    if (day && Object.keys(day).length) {
      const total = Object.values(day).reduce((sum, s) => sum + s.cost, 0);
      rows.push([key, total, Object.keys(day).length]);
    }
  }
  $("history").replaceChildren(...rows.map(([key, total, sites]) => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = `${dayLabel(key)} (${sites} site${sites === 1 ? "" : "s"})`;
    const amt = document.createElement("span");
    amt.textContent = `$${total.toFixed(2)}`;
    li.append(name, amt);
    return li;
  }));
  $("historyEmpty").hidden = rows.length > 0;
}

async function init() {
  const { hourlyRate = 85 } = await chrome.storage.local.get("hourlyRate");
  $("rate").value = hourlyRate;
  await renderDomains();
  await renderHistory();
}

$("rate").addEventListener("change", async () => {
  const n = Number($("rate").value);
  if (!Number.isFinite(n) || n < 0) return status("rateStatus", "Enter a rate of 0 or more.", "err");
  await chrome.storage.local.set({ hourlyRate: n });
  status("rateStatus", `Saved. Every hour of scrolling now costs $${n}.`, "ok");
});

$("addForm").addEventListener("submit", async e => {
  e.preventDefault();
  const d = cleanDomain($("newDomain").value);
  if (!d) return;
  const { bleedDomains = [] } = await chrome.storage.local.get("bleedDomains");
  if (!bleedDomains.includes(d)) await chrome.storage.local.set({ bleedDomains: [...bleedDomains, d] });
  $("newDomain").value = "";
});

$("export").addEventListener("click", async () => {
  const { history = {} } = await chrome.storage.local.get("history");
  const esc = v => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [["date", "domain", "minutes", "cost_usd"]];
  for (const date of Object.keys(history).sort()) {
    for (const [domain, s] of Object.entries(history[date]).sort((a, b) => b[1].cost - a[1].cost)) {
      rows.push([date, domain, (s.seconds / 60).toFixed(1), s.cost.toFixed(2)]);
    }
  }
  const csv = rows.map(r => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `hourly-bleed-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local") return;
  if (changes.bleedDomains) renderDomains();
  if (changes.history) renderHistory();
});

init();
