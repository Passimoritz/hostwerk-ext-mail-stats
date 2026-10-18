// Mail-Statistik – Seite. Daten: abgefangene Mails des Mail-Fängers (read:mail), Logik in lib.js.
const { html, t } = Hostwerk;
const S = MailStats;
async function load() {
  const settings = await Hostwerk.settings.get();
  const days = Number(settings.days) || 14;
  const list = await Hostwerk.get('/mail/messages');
  const sum = S.summary(list);
  Hostwerk.render('#stats', html`
    <div class="hw-card hw-stat"><div class="hw-k">${t('total')}</div><div class="hw-v">${Hostwerk.fmt.number(sum.total)}</div></div>
    <div class="hw-card hw-stat"><div class="hw-k">${t('today')}</div><div class="hw-v">${sum.today}</div></div>
    <div class="hw-card hw-stat"><div class="hw-k">${t('unread')}</div><div class="hw-v">${sum.unread}</div></div>
    <div class="hw-card hw-stat"><div class="hw-k">${t('avgSize')}</div><div class="hw-v">${Hostwerk.fmt.bytes(sum.avgSize)}</div></div>`);
  if (!list.length) { Hostwerk.render('#chart', html`<div class="hw-empty"><b>${t('empty')}</b>${t('emptyHint')}</div>`); Hostwerk.render('#tops', ''); return; }
  const b = S.bars(S.perDay(list, days));
  Hostwerk.render('#chart', html`<div class="bars">${b.map((d) => html`<div class="bar-col" title="${new Date(d.date).toLocaleDateString(Hostwerk.lang === 'de' ? 'de-DE' : 'en-US')}: ${d.n}"><div class="bar" style="height:${Math.max(2, d.pct)}%"></div><span class="hw-tiny hw-muted">${new Date(d.date).getDate()}</span></div>`)}</div>`);
  const box = (title, rows) => html`<div class="hw-card"><h3 class="hw-h3">${title}</h3>${rows.length ? rows.map((r) => html`<div class="row"><span class="hw-ellipsis hw-grow">${r.key}</span><b>${r.n}</b></div>`) : html`<div class="hw-muted hw-small">–</div>`}</div>`;
  Hostwerk.render('#tops', html`${box(t('byProject'), S.top(list, (m) => S.domain(m.from)))}${box(t('bySender'), S.top(list, (m) => S.address(m.from)))}${box(t('byRecipient'), S.top(list, (m) => S.address(m.to)))}`);
}
Hostwerk.ready().then(() => { load(); setInterval(load, 30000); Hostwerk.on('settings', load); Hostwerk.on('lang', load); });
