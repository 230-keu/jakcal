const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const els = new Map();
const mk = (id) => {
  const h = {}; const cls = new Set(); const at = {};
  const el = { id, value: '', checked: false, hidden: false, textContent: '',
    classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), toggle: (c, f) => (f ? cls.add(c) : cls.delete(c)) },
    setAttribute: (k, v) => { at[k] = v; }, getAttribute: (k) => at[k] ?? null,
    setSelectionRange() {}, focus() {}, scrollIntoView() {},
    addEventListener: (t, f) => { (h[t] ||= []).push(f); },
    fire: (t) => (h[t] || []).forEach((f) => f({ currentTarget: el })) };
  els.set(id, el); return el;
};
for (const m of html.matchAll(/id="([^"]+)"/g)) mk(m[1]);
els.get('select-ppn').value = '0.11';
els.get('select-pph').value = '0.02';
const root = mk('root');
const ctx = vm.createContext({
  Intl, Math, Number, String, Object, console,
  document: { documentElement: root, activeElement: null, getElementById: (i) => els.get(i) },
  window: { innerWidth: 1024 },
  localStorage: { getItem: () => null, setItem() {} },
  navigator: { clipboard: { writeText: async () => {} } },
  setTimeout
});
ctx.globalThis = ctx;

// Same as browser: classic scripts sharing one global scope, in index.html order
for (const src of [...html.matchAll(/<script src="\.\/([^"]+)"/g)].map((m) => m[1])) {
  vm.runInContext(fs.readFileSync(src, 'utf8'), ctx, { filename: src });
}

const v = els.get('input-vendor');
v.value = '2.180.000'; v.fire('input');
assert.equal(els.get('input-dpp').value, '2.000.000');
assert.equal(els.get('input-total').value, '2.220.000');
els.get('theme-toggle').fire('click');
assert.equal(root.getAttribute('data-theme'), 'dark');

// DPP Nilai Lain: nonaktif kecuali PPN 12%, lalu baris tampil dan terhitung
const nl = els.get('check-dpp-nl');
assert.equal(nl.disabled, true);
assert.equal(els.get('row-dppnl').hidden, true);
els.get('select-ppn').value = '0.12'; els.get('select-ppn').fire('change');
assert.equal(nl.disabled, false);
const dpp = els.get('input-dpp');
dpp.value = '1.000.000'; dpp.fire('input');
nl.checked = true; nl.fire('change');
assert.equal(els.get('row-dppnl').hidden, false);
assert.equal(els.get('input-dppnl').value, '916.667');
assert.equal(els.get('input-ppn').value, '110.000');
assert.equal(els.get('input-total').value, '1.110.000');
els.get('select-ppn').value = '0.11'; els.get('select-ppn').fire('change');
assert.equal(nl.checked, false);
assert.equal(els.get('row-dppnl').hidden, true);
console.log('BROWSER-LIKE LOAD OK');

