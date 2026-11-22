/* MailStats – pure logic without DOM, tested in tests/lib.test.js (node --test). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MailStats = api;
}(typeof self !== 'undefined' ? self : this, () => {
  const DAY = 86400000;
  const pad = (n) => String(n).padStart(2, '0');
  function dayKey(ts) { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  const EMAIL = /[^\s<>,;"']+@[^\s<>,;"']+/g;
  /** Adresse ohne Anzeigenamen: "Shop <shop@x.test>" → shop@x.test (nur <…> mit @ zählt, nicht "<b>Name</b>"). */
  function address(s) {
    const str = String(s || '');
    const m = str.match(/<([^<>\s]*@[^<>\s]*)>/) || str.match(new RegExp(EMAIL.source));
    return (m ? m[1] || m[0] : str).trim().toLowerCase();
  }
  /** Alle Adressen einer Kopfzeile ("A <a@x>, b@y") – Anzeigenamen dürfen Kommas enthalten. */
  function addresses(s) { return [...new Set((String(s || '').match(EMAIL) || []).map((a) => a.toLowerCase()))]; }
  /** Empfänger einer Mail: Umschlag-Empfänger (rcpt, auch Bcc), sonst alle Adressen aus „An“; mindestens "?". */
  function recipients(m) {
    const list = Array.isArray(m.rcpt) && m.rcpt.length ? [...new Set(m.rcpt.map((a) => address(a)).filter(Boolean))] : addresses(m.to);
    return list.length ? list : [address(m.to) || '?'];
  }
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
  /** Häufigste Werte (Absender, Empfänger, Domain). key(m) darf mehrere Werte liefern (Array, z. B. Empfänger). */
  function top(messages, key, n = 5) {
    const c = new Map();
    for (const m of messages || []) for (const k of [].concat(key(m))) c.set(k, (c.get(k) || 0) + 1);
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
  /** Filter der Seite: nach Projekt (Absender-Domain), Absender, Empfänger oder Tag (JJJJ-MM-TT). */
  const KEYS = { project: (m) => domain(m.from), sender: (m) => address(m.from) || '?', recipient: recipients, day: (m) => dayKey(m.date) };
  function filter(messages, f) { if (!f || !KEYS[f.kind]) return messages || []; return (messages || []).filter((m) => [].concat(KEYS[f.kind](m)).includes(f.value)); }
  /**
   * Spitze erkennen (z. B. eine Mail-Endlosschleife): heute mindestens 20 Mails und mehr als das Fünffache des
   * Medians der Vortage (mindestens 1). Liefert { today, usual } oder null.
   */
  function spike(days, { min = 20, factor = 5 } = {}) {
    if (!days || days.length < 3) return null;
    const today = days[days.length - 1].n;
    const prev = days.slice(0, -1).map((d) => d.n).sort((a, b) => a - b);
    const mid = prev.length >> 1;
    const usual = prev.length % 2 ? prev[mid] : (prev[mid - 1] + prev[mid]) / 2;
    return today >= min && today > factor * Math.max(1, usual) ? { today, usual } : null;
  }
  /** „Mail-Fänger öffnen“ mit dem Filter als Suche (#/mail?q=…) – ein Tag lässt sich dort nicht suchen, dann ohne. */
  function catcherPath(f) { return f && f.value && f.kind !== 'day' ? `/mail?q=${encodeURIComponent(f.value)}` : '/mail'; }
  return { dayKey, address, addresses, recipients, domain, perDay, top, summary, bars, filter, spike, catcherPath, KEYS };
}));
