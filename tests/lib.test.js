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
