// Mail-Statistik – Seite. Daten: abgefangene Mails des Mail-Fängers (read:mail), Logik in lib.js.
const { html, t } = Hostwerk;
const S = MailStats;
const REFRESH = 30000;
let lastLoad = 0;
let filter = null; // { kind: 'project' | 'sender' | 'recipient' | 'day', value, label }
let warned = ''; // Spitze schon gemeldet (je Tag einmal pro Sitzung)
const locale = () => (Hostwerk.lang === 'de' ? 'de-DE' : 'en-US');
const num = (n) => Hostwerk.fmt.number(n);
// Bewegung wie in Hostwerk (SDK 3.6): Zahlen zählen zum neuen Wert, der leere Zustand kommt von Hostwerk.
// Ältere Hostwerk-Versionen kennen countUp/ui.empty nicht – dann steht der Wert einfach da.
const shown = {};
const counter = (key, n) => { const from = Hostwerk.ui.countUp ? (shown[key] || 0) : n; return html`<div class="v" data-count="${key}" data-hw-count="${from}">${num(from)}</div>`; };
function countAll(values) { for (const [k, n] of Object.entries(values)) { const el = document.querySelector(`[data-count="${k}"]`); if (el && Hostwerk.ui.countUp) Hostwerk.ui.countUp(el, n); shown[k] = n; } }
const MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>'; // Lucide „mail“ (ISC)

function showError(msg) {
  Hostwerk.render('#alert', html`<div class="callout err" role="alert"><div class="grow"><b class="callout-title">${t('errorTitle')}</b><span>${msg}</span></div><button class="btn sm" data-retry>${t('retry')}</button></div>`);
  for (const id of ['#stats', '#chart', '#tops', '#filter']) Hostwerk.render(id, '');
}

async function load() {
  lastLoad = Date.now();
  const settings = await Hostwerk.settings.get();
  const days = Number(settings.days) || 14;
  let all;
  try { all = await Hostwerk.get('/mail/messages'); } catch (e) { showError(e.message); return; }
  // Spitze immer über alle Mails – ein Filter soll keine Warnung verstecken
  const peak = S.spike(S.perDay(all, 14));
  const todayKey = S.dayKey(Date.now());
  Hostwerk.render('#alert', peak ? html`<div class="callout warn" role="status"><div class="grow"><b class="callout-title">${t('spikeTitle')}</b><span>${t('spikeText', { n: num(peak.today), usual: num(Math.round(peak.usual)) })}</span></div><button class="btn sm" data-go="/mail">${t('openCatcher')}</button></div>` : '');
  if (peak && warned !== todayKey) { warned = todayKey; Hostwerk.toast(t('spikeTitle'), { kind: 'warning' }); }
  const list = S.filter(all, filter);
  Hostwerk.render('#filter', filter ? html`<div class="row ms-filter"><span class="chip">${t('filter.' + filter.kind)}: <b>${filter.label || filter.value}</b></span><button class="btn ghost sm" data-clear>${t('clearFilter')}</button><button class="btn ghost sm" data-go="/mail">${t('openCatcher')}</button></div>` : '');
  const sum = S.summary(list);
  Hostwerk.render('#stats', html`
    <div class="card card-pad stat"><div class="k">${t('total')}</div>${counter('total', sum.total)}</div>
    <div class="card card-pad stat"><div class="k">${t('today')}</div>${counter('today', sum.today)}</div>
    <div class="card card-pad stat"><div class="k">${t('unread')}</div>${counter('unread', sum.unread)}</div>
    <div class="card card-pad stat"><div class="k">${t('withAttachment')}</div>${counter('attachments', sum.attachments)}</div>
    <div class="card card-pad stat"><div class="k">${t('avgSize')}</div><div class="v">${Hostwerk.fmt.bytes(sum.avgSize)}</div></div>`);
  countAll({ total: sum.total, today: sum.today, unread: sum.unread, attachments: sum.attachments });
  if (!all.length) {
    const open = html`<button class="btn sm" data-go="/mail">${t('openCatcher')}</button>`;
    Hostwerk.render('#chart', Hostwerk.ui.empty ? Hostwerk.ui.empty({ title: t('empty'), text: t('emptyHint'), icon: Hostwerk.raw(MAIL), action: open }) : html`<div class="empty-state"><h3>${t('empty')}</h3><p>${t('emptyHint')}</p><div class="empty-action">${open}</div></div>`);
    Hostwerk.render('#tops', '');
    return;
  }
  const b = S.bars(S.perDay(list, days));
  const long = (d) => new Date(d).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
  // Jeder Tag ist ein Knopf: per Tastatur erreichbar, mit Namen für Bildschirmleser, Klick filtert auf den Tag
  Hostwerk.render('#chart', html`<div class="ms-bars" role="group" aria-label="${t('perDay')}">${b.map((d) => {
    const label = t('dayLabel', { day: long(d.date), n: num(d.n) });
    const on = filter && filter.kind === 'day' && filter.value === d.key;
    return html`<button class="ms-col" data-kind="day" data-value="${d.key}" data-label="${long(d.date)}" aria-pressed="${on ? 'true' : 'false'}" title="${label}" aria-label="${label}"><div class="ms-bar" style="${'height:' + Math.max(2, d.pct) + '%'}"></div><span class="tiny muted" aria-hidden="true">${new Date(d.date).getDate()}</span></button>`;
  })}</div>`);
  const box = (title, kind, rows) => html`<div class="card card-pad"><h3 class="card-title ms-box-title">${title}</h3>${rows.length ? rows.map((r) => {
    const on = filter && filter.kind === kind && filter.value === r.key;
    return html`<button class="ms-line ${on ? 'on' : ''}" data-kind="${kind}" data-value="${r.key}" aria-pressed="${on ? 'true' : 'false'}" title="${t('filterBy', { what: r.key })}"><span class="ellipsis grow">${r.key}</span><b>${num(r.n)}</b></button>`;
  }) : html`<div class="muted small">–</div>`}</div>`;
  Hostwerk.render('#tops', html`${box(t('byProject'), 'project', S.top(list, S.KEYS.project))}${box(t('bySender'), 'sender', S.top(list, S.KEYS.sender))}${box(t('byRecipient'), 'recipient', S.top(list, S.KEYS.recipient))}`);
}

document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go) { Hostwerk.navigate(go.dataset.go); return; }
  if (e.target.closest('[data-retry]')) { load(); return; }
  if (e.target.closest('[data-clear]')) { filter = null; load(); return; }
  const pick = e.target.closest('[data-kind]');
  if (pick) {
    const f = { kind: pick.dataset.kind, value: pick.dataset.value, label: pick.dataset.label || '' };
    filter = filter && filter.kind === f.kind && filter.value === f.value ? null : f; // zweiter Klick hebt den Filter auf
    load();
  }
});
// Versteckter Reiter: nicht abfragen; beim Zurückkommen sofort nachholen
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastLoad >= REFRESH) load(); });
Hostwerk.ready().then(() => { load(); setInterval(() => { if (!document.hidden) load(); }, REFRESH); Hostwerk.on('settings', load); Hostwerk.on('lang', load); });
