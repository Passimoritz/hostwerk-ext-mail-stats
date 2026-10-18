/* MailStats – pure logic without DOM, tested in tests/lib.test.js (node --test). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MailStats = api;
}(typeof self !== 'undefined' ? self : this, () => {
  const DAY = 86400000;
  const pad = (n) => String(n).padStart(2, '0');
  function dayKey(ts) { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  /** Adresse ohne Anzeigenamen: "Shop <shop@x.test>" → shop@x.test */
  function address(s) { const m = String(s || '').match(/<([^>]+)>/); return (m ? m[1] : String(s || '')).trim().toLowerCase(); }
  /** Domain einer Adresse – steht meist für das Projekt, das die Mail verschickt hat. */
  function domain(s) { const a = address(s); const i = a.lastIndexOf('@'); return i > 0 ? a.slice(i + 1) : a || '?'; }
  /** Mails je Tag der letzten N Tage (ältester zuerst), auch Tage ohne Mail. */
  function perDay(messages, days = 14, now = Date.now()) {
    const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (days - 1));
    const out = [];
    for (let i = 0; i < days; i++) { const d = new Date(start); d.setDate(start.getDate() + i); out.push({ key: dayKey(d.getTime()), date: d.getTime(), n: 0 }); }
    const map = new Map(out.map((x) => [x.key, x]));
    for (const m of messages || []) { const d = map.get(dayKey(m.date)); if (d) d.n++; }
    return out;
  }
  /** Häufigste Werte (Absender, Empfänger, Domain). */
  function top(messages, key, n = 5) {
    const c = new Map();
    for (const m of messages || []) { const k = key(m); c.set(k, (c.get(k) || 0) + 1); }
    return [...c.entries()].map(([k, v]) => ({ key: k, n: v })).sort((a, b) => b.n - a.n || a.key.localeCompare(b.key)).slice(0, n);
  }
  /** Kennzahlen: gesamt, heute, ungelesen, mit Anhang, Ø-Größe. */
  function summary(messages, now = Date.now()) {
    const list = messages || [];
    const today = dayKey(now);
    return {
      total: list.length,
      today: list.filter((m) => dayKey(m.date) === today).length,
      unread: list.filter((m) => !m.read).length,
      attachments: list.filter((m) => m.attachments > 0).length,
      avgSize: list.length ? Math.round(list.reduce((n, m) => n + (m.size || 0), 0) / list.length) : 0,
    };
  }
  /** Höhe der Balken (0–100) relativ zum größten Tag. */
  function bars(days) { const max = Math.max(1, ...days.map((d) => d.n)); return days.map((d) => ({ ...d, pct: Math.round((d.n / max) * 100) })); }
  return { dayKey, address, domain, perDay, top, summary, bars };
}));
