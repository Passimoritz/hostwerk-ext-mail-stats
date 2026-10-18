// Mail-Statistik – Kachel: heute und die letzten 7 Tage als Mini-Balken.
const { html, t } = Hostwerk;
async function load() {
  const list = await Hostwerk.get('/mail/messages');
  const sum = MailStats.summary(list);
  document.getElementById('n').textContent = sum.today;
  document.getElementById('sub').textContent = t('widgetSub', { n: sum.total, unread: sum.unread });
  Hostwerk.render('#mini', html`${MailStats.bars(MailStats.perDay(list, 7)).map((d) => html`<div class="bar" style="height:${Math.max(4, d.pct)}%"></div>`)}`);
}
Hostwerk.ready().then(() => { load(); setInterval(load, 30000); });
