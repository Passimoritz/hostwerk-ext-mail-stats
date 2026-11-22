const test = require('node:test');
const assert = require('node:assert');
const S = require('../page/lib.js');
const NOW = new Date(2026, 9, 18, 15, 0).getTime();
const m = (from, to, daysAgo, extra = {}) => ({ from, to, date: NOW - daysAgo * 86400000, size: 1000, read: false, attachments: 0, ...extra });

test('Adressen und Domains (auch mit Anzeigenamen)', () => {
  assert.strictEqual(S.address('Shop <Shop@Example.TEST>'), 'shop@example.test');
  assert.strictEqual(S.domain('blog@meinblog.test'), 'meinblog.test');
  assert.strictEqual(S.domain(''), '?');
});

test('je Tag: feste Anzahl Tage, Lücken mit 0, ältester zuerst', () => {
  const d = S.perDay([m('a@x', 'b@y', 0), m('a@x', 'b@y', 0), m('a@x', 'b@y', 2), m('a@x', 'b@y', 30)], 7, NOW);
  assert.strictEqual(d.length, 7);
  assert.deepStrictEqual(d.map((x) => x.n), [0, 0, 0, 0, 1, 0, 2]);
});

test('Spitzenreiter sortiert, bei Gleichstand alphabetisch', () => {
  const list = [m('a@shop.test', 'k@x', 0), m('b@shop.test', 'k@x', 0), m('c@blog.test', 'k@x', 0)];
  assert.deepStrictEqual(S.top(list, (x) => S.domain(x.from)), [{ key: 'shop.test', n: 2 }, { key: 'blog.test', n: 1 }]);
});

test('Kennzahlen', () => {
  const s = S.summary([m('a@x', 'b@y', 0, { read: true, size: 3000, attachments: 1 }), m('a@x', 'b@y', 1)], NOW);
  assert.deepStrictEqual(s, { total: 2, today: 1, unread: 1, attachments: 1, avgSize: 2000 });
  assert.deepStrictEqual(S.summary([], NOW).avgSize, 0);
});

test('Balkenhöhen relativ zum Maximum, auch ohne Mails', () => {
  assert.deepStrictEqual(S.bars([{ n: 2 }, { n: 1 }, { n: 0 }]).map((x) => x.pct), [100, 50, 0]);
  assert.deepStrictEqual(S.bars([{ n: 0 }]).map((x) => x.pct), [0]);
});

test('Filter nach Projekt, Absender, Empfänger', () => {
  const list = [m('a@shop.test', 'k@x', 0), m('b@shop.test', 'L@x', 0), m('c@blog.test', 'k@x', 0)];
  assert.strictEqual(S.filter(list, { kind: 'project', value: 'shop.test' }).length, 2);
  assert.strictEqual(S.filter(list, { kind: 'sender', value: 'c@blog.test' }).length, 1);
  assert.strictEqual(S.filter(list, { kind: 'recipient', value: 'l@x' }).length, 1);
  assert.strictEqual(S.filter(list, null).length, 3);
});

test('Spitzen: viel mehr als sonst, aber erst ab 20 Mails', () => {
  const days = (ns) => ns.map((n) => ({ n }));
  assert.deepStrictEqual(S.spike(days([2, 3, 1, 2, 40])), { today: 40, usual: 2 });
  assert.strictEqual(S.spike(days([2, 3, 1, 2, 12])), null);
  assert.strictEqual(S.spike(days([30, 30, 30, 30, 60])), null);
  assert.deepStrictEqual(S.spike(days([0, 0, 0, 25])), { today: 25, usual: 0 });
});

test('Adressen: <…> nur mit @, sonst erste Adresse im Text', () => {
  assert.strictEqual(S.address('"<b>fett</b>" <X@xss.test>'), 'x@xss.test');
  assert.strictEqual(S.address('alert@xss.test /script <script>'), 'alert@xss.test');
  assert.strictEqual(S.address('Ümlaut Ärger <ümlaut@äöü.test>'), 'ümlaut@äöü.test');
  assert.deepStrictEqual(S.addresses('Kunde A <a@x.test>, b@x.test, "Größe, Jörg" <joerg@x.test>, A@x.test'), ['a@x.test', 'b@x.test', 'joerg@x.test']);
});

test('mehrere Empfänger zählen einzeln (Umschlag zuerst, sonst „An“)', () => {
  const list = [m('a@x', 'a@y.test, b@y.test', 0), m('a@x', 'Kunde <a@y.test>', 0, { rcpt: ['A@y.test', 'c@y.test'] }), m('a@x', '', 0)];
  assert.deepStrictEqual(S.top(list, S.KEYS.recipient), [{ key: 'a@y.test', n: 2 }, { key: '?', n: 1 }, { key: 'b@y.test', n: 1 }, { key: 'c@y.test', n: 1 }]);
  assert.strictEqual(S.filter(list, { kind: 'recipient', value: 'b@y.test' }).length, 1);
  assert.strictEqual(S.filter(list, { kind: 'recipient', value: 'a@y.test' }).length, 2);
  assert.strictEqual(S.filter(list, { kind: 'sender', value: 'a@x' }).length, 3);
});

test('open the mail catcher with the filter as search, a day without', () => {
  assert.strictEqual(S.catcherPath({ kind: 'sender', value: 'shop@müller.de' }), '/mail?q=shop%40m%C3%BCller.de');
  assert.strictEqual(S.catcherPath({ kind: 'project', value: 'example.com' }), '/mail?q=example.com');
  assert.strictEqual(S.catcherPath({ kind: 'day', value: '2026-11-22' }), '/mail');
  assert.strictEqual(S.catcherPath(null), '/mail');
});
