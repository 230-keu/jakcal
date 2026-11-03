const assert = require('node:assert/strict');
const fs = require('node:fs');
const { calculateTax, parseRupiahInput, formatNumberId, formatRupiah } = require('./calculator.js');

// 1. Screenshot reference case: Nominal 1.000.000, PPN 11%, PPh 2%, exclude PPN
const ref = calculateTax({
  source: 'nominal',
  value: 1_000_000,
  ppnRate: 0.11,
  pphRate: 0.02,
  includePpn: false
});
assert.equal(ref.dpp, 1_000_000);
assert.equal(ref.ppn, 110_000);
assert.equal(ref.total, 1_110_000);
assert.equal(ref.pph, 20_000);
assert.equal(ref.vendor, 1_090_000);

// 2. Reverse from Diterima vendor = 1.090.000 -> must restore exact DPP 1.000.000
const fromVendorExact = calculateTax({
  source: 'vendor',
  value: 1_090_000,
  ppnRate: 0.11,
  pphRate: 0.02,
  includePpn: false
});
assert.equal(fromVendorExact.dpp, 1_000_000);
assert.equal(fromVendorExact.ppn, 110_000);
assert.equal(fromVendorExact.total, 1_110_000);
assert.equal(fromVendorExact.pph, 20_000);
assert.equal(fromVendorExact.vendor, 1_090_000);

// 3. Reverse from Diterima vendor = 1.000.000 (boundary rounding case) -> ledger must stay 100% consistent
const fromVendorBoundary = calculateTax({
  source: 'vendor',
  value: 1_000_000,
  ppnRate: 0.11,
  pphRate: 0.02,
  includePpn: false
});
assert.equal(fromVendorBoundary.vendor, 1_000_000);
assert.equal(fromVendorBoundary.dpp + fromVendorBoundary.ppn, fromVendorBoundary.total);
assert.equal(fromVendorBoundary.total - fromVendorBoundary.pph, fromVendorBoundary.vendor);

// 4. Reverse from Total invoice = 1.110.000 (or Nominal with includePpn = true)
const fromTotal = calculateTax({
  source: 'nominal',
  value: 1_110_000,
  ppnRate: 0.11,
  pphRate: 0.02,
  includePpn: true
});
assert.equal(fromTotal.dpp, 1_000_000);
assert.equal(fromTotal.ppn, 110_000);
assert.equal(fromTotal.total, 1_110_000);
assert.equal(fromTotal.pph, 20_000);
assert.equal(fromTotal.vendor, 1_090_000);

// 5. Reverse from PPN = 110.000 and PPh = 20.000
const fromPpn = calculateTax({ source: 'ppn', value: 110_000, ppnRate: 0.11, pphRate: 0.02 });
assert.equal(fromPpn.dpp, 1_000_000);
assert.equal(fromPpn.vendor, 1_090_000);

const fromPph = calculateTax({ source: 'pph', value: 20_000, ppnRate: 0.11, pphRate: 0.02 });
assert.equal(fromPph.dpp, 1_000_000);
assert.equal(fromPph.vendor, 1_090_000);

// 6. Error state check: PPh rate >= 100% + PPN
const errResult = calculateTax({ source: 'vendor', value: 1_000_000, ppnRate: 0.11, pphRate: 1.2 });
assert.ok(errResult.error);

// 7. Formatting & parsing checks
assert.equal(parseRupiahInput('Rp 1.090.000'), 1_090_000);
assert.equal(formatNumberId(1090000), '1.090.000');
assert.equal(formatRupiah(20000, true), '- Rp 20.000');

// 8. R-02 Hard Gate Check: Ensure zero em dashes (\u2014) in any project file
for (const file of ['index.html', 'style.css', 'app.js', 'calculator.js', 'DESIGN.md']) {
  const content = fs.readFileSync(file, 'utf8');
  assert.equal(content.includes('\u2014'), false, `Found forbidden em dash in ${file}`);
}

// 9. Interactive DOM Click-Through Simulation (R-35 Verification)
const elements = new Map();
function makeEl(id, initialVal = '') {
  const listeners = {};
  const classes = new Set();
  const attrs = { 'data-theme': 'light' };
  const el = {
    id,
    value: initialVal,
    checked: false,
    hidden: false,
    textContent: '',
    selectionStart: String(initialVal).length,
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      toggle: (c, force) => (force ? classes.add(c) : classes.delete(c)),
      contains: (c) => classes.has(c)
    },
    setAttribute: (k, v) => { attrs[k] = v; },
    getAttribute: (k) => attrs[k],
    setSelectionRange: (s) => { el.selectionStart = s; },
    focus: () => { globalThis.document.activeElement = el; },
    scrollIntoView: () => {},
    addEventListener: (type, fn) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    dispatch: async (type) => {
      for (const fn of listeners[type] || []) {
        await fn({ currentTarget: el, target: el });
      }
    }
  };
  elements.set(id, el);
  return el;
}

const defaults = {
  'input-nominal': '1.000.000',
  'select-ppn': '0.11',
  'select-pph': '0.02',
  'input-custom-pph': '2',
  'input-dpp': '1.000.000',
  'input-ppn': '110.000',
  'input-total': '1.110.000',
  'input-pph': '20.000',
  'input-vendor': '1.090.000'
};

const html = fs.readFileSync('index.html', 'utf8');
const idMatches = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
for (const id of idMatches) {
  makeEl(id, defaults[id] || '');
}

let clipboardText = '';
globalThis.window = { innerWidth: 1024 };
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
Object.defineProperty(globalThis, 'navigator', {
  value: {
    clipboard: {
      writeText: async (txt) => { clipboardText = txt; }
    }
  },
  configurable: true
});
globalThis.document = {
  activeElement: null,
  documentElement: makeEl('html-root'),
  getElementById: (id) => elements.get(id)
};

(async () => {
  require('./app.js');

  // Verify initial render
  assert.equal(elements.get('input-vendor').value, '1.090.000');

  // Verify editing Diterima vendor directly -> updates DPP, PPN, Total, PPh, and Nominal
  const vendorInput = elements.get('input-vendor');
  vendorInput.value = '2.180.000';
  await vendorInput.dispatch('input');
  assert.equal(elements.get('input-dpp').value, '2.000.000');
  assert.equal(elements.get('input-ppn').value, '220.000');
  assert.equal(elements.get('input-total').value, '2.220.000');
  assert.equal(elements.get('input-pph').value, '40.000');
  assert.equal(elements.get('input-nominal').value, '2.000.000');
  assert.equal(elements.get('badge-vendor').hidden, false);

  // Verify editing Total invoice directly -> updates DPP, PPN, PPh, Vendor
  const totalInput = elements.get('input-total');
  totalInput.value = '1.110.000';
  await totalInput.dispatch('input');
  assert.equal(elements.get('input-dpp').value, '1.000.000');
  assert.equal(elements.get('input-vendor').value, '1.090.000');

  // Verify checkbox "Nominal sudah termasuk PPN"
  const checkInclude = elements.get('check-include-ppn');
  checkInclude.checked = true;
  await checkInclude.dispatch('change');
  assert.equal(elements.get('input-total').value, '1.000.000');
  assert.equal(elements.get('input-dpp').value, '900.901');

  // Verify Copy (SALIN) button
  await elements.get('btn-copy').dispatch('click');
  assert.ok(clipboardText.includes('Diterima vendor: Rp'));
  assert.equal(elements.get('copy-label').textContent, 'TERSALIN');

  // Verify Reset button (Empty State)
  await elements.get('btn-reset').dispatch('click');
  assert.equal(elements.get('input-dpp').value, '0');
  assert.ok(elements.get('status-text').textContent.includes('Kosong'));

  // Verify Theme Toggle (Light <-> Dark)
  await elements.get('theme-toggle').dispatch('click');
  assert.equal(globalThis.document.documentElement.getAttribute('data-theme'), 'dark');
  await elements.get('theme-toggle').dispatch('click');
  assert.equal(globalThis.document.documentElement.getAttribute('data-theme'), 'light');

  console.log('ALL UNIT + DOM INTERACTIVE CLICK-THROUGH CHECKS PASSED');
})();
