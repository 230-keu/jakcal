(function () {
const taxApi = (typeof globalThis !== 'undefined' && globalThis.TaxCalculator)
  ? globalThis.TaxCalculator
  : (typeof require !== 'undefined' ? require('./calculator.js') : {});

const {
  calculateTax,
  formatNumberId,
  formatRupiah,
  parseRupiahInput
} = taxApi;

const SOURCE_LABELS = {
  nominal: 'Nominal (Rp)',
  dpp: 'Dasar (DPP)',
  ppn: 'PPN',
  total: 'Total invoice (DPP + PPN)',
  pph: 'PPh dipotong',
  vendor: 'Diterima vendor (Hitung Mundur)'
};

const dom = {
  themeToggle: document.getElementById('theme-toggle'),
  themeLabel: document.getElementById('theme-label'),
  inputNominal: document.getElementById('input-nominal'),
  nominalModeHint: document.getElementById('nominal-mode-hint'),
  btnReset: document.getElementById('btn-reset'),
  selectPpn: document.getElementById('select-ppn'),
  checkIncludePpn: document.getElementById('check-include-ppn'),
  selectPph: document.getElementById('select-pph'),
  customPphContainer: document.getElementById('custom-pph-container'),
  inputCustomPph: document.getElementById('input-custom-pph'),
  statusText: document.getElementById('status-text'),
  errorBanner: document.getElementById('error-banner'),
  errorText: document.getElementById('error-text'),
  btnCopy: document.getElementById('btn-copy'),
  copyLabel: document.getElementById('copy-label'),
  labelPpnRate: document.getElementById('label-ppn-rate'),
  labelPphRate: document.getElementById('label-pph-rate'),
  prefixPph: document.getElementById('prefix-pph'),
  rows: {
    dpp: document.getElementById('row-dpp'),
    ppn: document.getElementById('row-ppn'),
    total: document.getElementById('row-total'),
    pph: document.getElementById('row-pph'),
    vendor: document.getElementById('row-vendor')
  },
  badges: {
    dpp: document.getElementById('badge-dpp'),
    ppn: document.getElementById('badge-ppn'),
    total: document.getElementById('badge-total'),
    pph: document.getElementById('badge-pph'),
    vendor: document.getElementById('badge-vendor')
  },
  inputs: {
    nominal: document.getElementById('input-nominal'),
    dpp: document.getElementById('input-dpp'),
    ppn: document.getElementById('input-ppn'),
    total: document.getElementById('input-total'),
    pph: document.getElementById('input-pph'),
    vendor: document.getElementById('input-vendor')
  }
};

const state = {
  source: 'nominal',
  value: 1_000_000,
  ppnRate: 0.11,
  pphRate: 0.02,
  includePpn: false,
  lastResult: null
};

function getEffectivePphRate() {
  if (dom.selectPph.value === 'custom') {
    const rawPct = Number.parseFloat(dom.inputCustomPph.value);
    if (!Number.isFinite(rawPct) || rawPct < 0) return 0;
    return rawPct / 100;
  }
  return Number.parseFloat(dom.selectPph.value) || 0;
}

function formatPercentLabel(rateDecimal) {
  const pct = Number((rateDecimal * 100).toFixed(4));
  return `${String(pct).replace('.', ',')}%`;
}

function setFormattedValuePreservingCursor(inputEl, numericValue) {
  const formatted = formatNumberId(numericValue);
  if (document.activeElement !== inputEl) {
    inputEl.value = formatted;
    return;
  }

  const rawBefore = inputEl.value;
  const selStart = inputEl.selectionStart ?? rawBefore.length;
  const digitsBeforeCursor = rawBefore.slice(0, selStart).replace(/[^\d]/g, '').length;

  inputEl.value = formatted;

  if (digitsBeforeCursor === 0) {
    inputEl.setSelectionRange(0, 0);
    return;
  }

  let seenDigits = 0;
  let newPos = formatted.length;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seenDigits++;
      if (seenDigits === digitsBeforeCursor) {
        newPos = i + 1;
        break;
      }
    }
  }
  inputEl.setSelectionRange(newPos, newPos);
}

function updateActiveBadges() {
  const effectiveRowSource =
    state.source === 'nominal' ? (state.includePpn ? 'total' : 'dpp') : state.source;

  for (const key of ['dpp', 'ppn', 'total', 'pph', 'vendor']) {
    const isCurrent = key === effectiveRowSource;
    dom.rows[key].classList.toggle('is-source', isCurrent);
    dom.badges[key].hidden = !isCurrent;
  }

  dom.nominalModeHint.textContent = state.includePpn
    ? 'Nominal berisi Total Invoice (DPP + PPN)'
    : 'Nominal berisi Nilai Dasar (DPP)';
}

function render(activeInputKey = null, autoNotice = '') {
  state.ppnRate = Number.parseFloat(dom.selectPpn.value) || 0;
  state.pphRate = getEffectivePphRate();
  state.includePpn = dom.checkIncludePpn.checked;

  dom.labelPpnRate.textContent = `(${formatPercentLabel(state.ppnRate)})`;
  dom.labelPphRate.textContent = `(${formatPercentLabel(state.pphRate)})`;

  const result = calculateTax({
    source: state.source,
    value: state.value,
    ppnRate: state.ppnRate,
    pphRate: state.pphRate,
    includePpn: state.includePpn
  });

  state.lastResult = result;

  if (result.error) {
    dom.errorBanner.hidden = false;
    dom.errorText.textContent = result.error;
    dom.statusText.textContent = 'Periksa kembali tarif pajak yang dimasukkan.';
    return;
  }

  dom.errorBanner.hidden = true;
  dom.errorText.textContent = '';

  dom.prefixPph.textContent = result.pph > 0 ? '- Rp' : 'Rp';

  for (const key of ['nominal', 'dpp', 'ppn', 'total', 'pph', 'vendor']) {
    const inputEl = dom.inputs[key];
    if (key === activeInputKey) {
      setFormattedValuePreservingCursor(inputEl, state.value);
    } else {
      inputEl.value = formatNumberId(result[key]);
    }
  }

  updateActiveBadges();

  if (autoNotice) {
    dom.statusText.textContent = autoNotice;
  } else if (state.value === 0) {
    dom.statusText.textContent =
      'Status: Kosong (Rp 0). Ketik nominal pada kolom mana saja untuk mulai menghitung.';
  } else {
    const sourceLabel = SOURCE_LABELS[state.source] || 'Nominal';
    dom.statusText.textContent = `Acuan hitung aktif: ${sourceLabel} (${formatRupiah(state.value)}).`;
  }
}

function handleAmountInput(sourceKey, event) {
  const inputEl = event.currentTarget;
  const parsed = parseRupiahInput(inputEl.value);
  let autoNotice = '';

  if (sourceKey === 'ppn' && parsed > 0 && Number.parseFloat(dom.selectPpn.value) === 0) {
    dom.selectPpn.value = '0.11';
    autoNotice = 'Tarif PPN otomatis diatur ke 11% karena kolom PPN diisi.';
  }

  if (sourceKey === 'pph' && parsed > 0 && getEffectivePphRate() === 0) {
    dom.selectPph.value = '0.02';
    dom.customPphContainer.hidden = true;
    autoNotice = 'Potongan PPh otomatis diatur ke 2% karena kolom PPh diisi.';
  }

  state.source = sourceKey;
  state.value = parsed;
  render(sourceKey, autoNotice);
}

for (const [key, inputEl] of Object.entries(dom.inputs)) {
  inputEl.addEventListener('input', (e) => handleAmountInput(key, e));

  inputEl.addEventListener('focus', () => {
    if (typeof window !== 'undefined' && window.innerWidth < 600) {
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

dom.selectPpn.addEventListener('change', () => {
  if (state.source === 'ppn' && Number.parseFloat(dom.selectPpn.value) === 0 && state.lastResult) {
    state.source = 'dpp';
    state.value = state.lastResult.dpp;
  }
  render();
});

dom.checkIncludePpn.addEventListener('change', () => {
  state.source = 'nominal';
  state.value = parseRupiahInput(dom.inputNominal.value);
  render();
});

dom.selectPph.addEventListener('change', () => {
  const isCustom = dom.selectPph.value === 'custom';
  dom.customPphContainer.hidden = !isCustom;
  if (isCustom) {
    dom.inputCustomPph.focus();
  } else if (state.source === 'pph' && Number.parseFloat(dom.selectPph.value) === 0 && state.lastResult) {
    state.source = 'dpp';
    state.value = state.lastResult.dpp;
  }
  render();
});

dom.inputCustomPph.addEventListener('input', () => {
  render();
});

dom.btnReset.addEventListener('click', () => {
  state.source = 'nominal';
  state.value = 0;
  render();
  dom.inputNominal.focus();
});

dom.btnCopy.addEventListener('click', async () => {
  if (!state.lastResult) return;
  const r = state.lastResult;
  const ppnLabel = formatPercentLabel(state.ppnRate);
  const pphLabel = formatPercentLabel(state.pphRate);

  const summaryLines = [
    `Dasar (DPP): ${formatRupiah(r.dpp)}`,
    `PPN (${ppnLabel}): ${formatRupiah(r.ppn)}`,
    `Total invoice (DPP + PPN): ${formatRupiah(r.total)}`,
    `PPh dipotong (${pphLabel}): ${formatRupiah(r.pph, true)}`,
    `Diterima vendor: ${formatRupiah(r.vendor)}`
  ].join('\n');

  try {
    await navigator.clipboard.writeText(summaryLines);
  } catch {
    const temp = document.createElement('textarea');
    temp.value = summaryLines;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    temp.remove();
  }

  dom.btnCopy.classList.add('copied');
  dom.copyLabel.textContent = 'TERSALIN';
  dom.statusText.textContent = 'Rincian perhitungan berhasil disalin ke clipboard.';

  setTimeout(() => {
    dom.btnCopy.classList.remove('copied');
    dom.copyLabel.textContent = 'SALIN';
  }, 2000);
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  dom.themeLabel.textContent = theme === 'dark' ? 'Mode Terang' : 'Mode Gelap';
  try {
    localStorage.setItem('pajak_theme', theme);
  } catch {
    // Ignore storage restriction
  }
}

const savedTheme = (() => {
  try {
    return localStorage.getItem('pajak_theme');
  } catch {
    return null;
  }
})();

if (savedTheme === 'dark' || savedTheme === 'light') {
  applyTheme(savedTheme);
}

dom.themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

render();

})();
