// Mail-Statistik – Kachel: heute und die letzten 7 Tage als Mini-Balken.
const { html, t } = Hostwerk;
const S = MailStats;
const REFRESH = 30000;
let lastLoad = 0;
async function load() {
  lastLoad = Date.now();
  let list;
  try { list = await Hostwerk.get('/mail/messages'); } catch {
    Hostwerk.render('#app', html`<div class="stack" role="alert"><span class="small c-err">${t('errorShort')}</span><div><button class="btn xs" data-retry>${t('retry')}</button></div></div>`);
    return;
  }
  const sum = S.summary(list);
  const week = S.perDay(list, 7);
  const peak = S.spike(S.perDay(list, 14));
  const fmtDay = (d) => new Date(d).toLocaleDateString(Hostwerk.lang === 'de' ? 'de-DE' : 'en-US', { weekday: 'short', day: 'numeric' });
  Hostwerk.render('#app', html`<div class="muted small">${t('widgetToday')}</div>
    <div class="ms-big ${peak ? 'c-warn' : ''}">${Hostwerk.fmt.number(sum.today)}</div>
    <div class="tiny muted">${t('widgetSub', { n: Hostwerk.fmt.number(sum.total), unread: Hostwerk.fmt.number(sum.unread) })}</div>
    ${peak ? html`<div class="tiny c-warn">${t('spikeShort')}</div>` : ''}
    <div class="ms-mini" role="img" aria-label="${t('weekLabel', { list: week.map((d) => `${fmtDay(d.date)}: ${d.n}`).join(', ') })}">${S.bars(week).map((d) => html`<div class="ms-bar" style="${'height:' + Math.max(4, d.pct) + '%'}"></div>`)}</div>`);
}
document.addEventListener('click', (e) => { if (e.target.closest('[data-retry]')) load(); });
// Eingeklappte Übersicht oder verstecktes Fenster: nicht abfragen, beim Zurückkommen sofort nachholen
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastLoad >= REFRESH) load(); });
Hostwerk.ready().then(() => { load(); setInterval(() => { if (!document.hidden) load(); }, REFRESH); Hostwerk.on('lang', load); });
