// Mail-Statistik – Seite. Daten: abgefangene Mails des Mail-Fängers (read:mail), Logik in lib.js.
const { html, t } = Hostwerk;
const S = MailStats;
const REFRESH = 30000;
let lastLoad = 0;
let filter = null; // { kind: 'project' | 'sender' | 'recipient' | 'day', value, label }
let warned = ''; // Spitze schon gemeldet (je Tag einmal pro Sitzung)
const locale = () => (Hostwerk.lang === 'de' ? 'de-DE' : 'en-US');
const num = (n) => Hostwerk.fmt.number(n);

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
    <div class="card card-pad stat"><div class="k">${t('total')}</div><div class="v">${num(sum.total)}</div></div>
    <div class="card card-pad stat"><div class="k">${t('today')}</div><div class="v">${num(sum.today)}</div></div>
    <div class="card card-pad stat"><div class="k">${t('unread')}</div><div class="v">${num(sum.unread)}</div></div>
    <div class="card card-pad stat"><div class="k">${t('withAttachment')}</div><div class="v">${num(sum.attachments)}</div></div>
    <div class="card card-pad stat"><div class="k">${t('avgSize')}</div><div class="v">${Hostwerk.fmt.bytes(sum.avgSize)}</div></div>`);
  if (!all.length) {
    Hostwerk.render('#chart', html`<div class="empty-state"><h3>${t('empty')}</h3><p>${t('emptyHint')}</p><div class="empty-action"><button class="btn sm" data-go="/mail">${t('openCatcher')}</button></div></div>`);
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
