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
  dpp: 'Harga sebelum pajak (DPP)',
  ppn: 'PPN',
  total: 'Total tagihan (harga + PPN)',
  dppnl: 'Dasar hitung PPN (DPP Nilai Lain)',
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
  checkDppNl: document.getElementById('check-dpp-nl'),
  checkPpnDipungut: document.getElementById('check-ppn-dipungut'),
  selectPph: document.getElementById('select-pph'),
  customPphContainer: document.getElementById('custom-pph-container'),
  inputCustomPph: document.getElementById('input-custom-pph'),
  statusText: document.getElementById('status-text'),
  errorBanner: document.getElementById('error-banner'),
  errorText: document.getElementById('error-text'),
  btnPrint: document.getElementById('btn-print'),
  btnCopy: document.getElementById('btn-copy'),
  copyLabel: document.getElementById('copy-label'),
  labelPpnRate: document.getElementById('label-ppn-rate'),
  labelPpnWapuRate: document.getElementById('label-ppn-wapu-rate'),
  labelPphRate: document.getElementById('label-pph-rate'),
  prefixPpnWapu: document.getElementById('prefix-ppn-wapu'),
  prefixPph: document.getElementById('prefix-pph'),
  rowPpnWapu: document.getElementById('row-ppn-wapu'),
  inputPpnWapu: document.getElementById('input-ppn-wapu'),
  rows: {
    dpp: document.getElementById('row-dpp'),
    dppnl: document.getElementById('row-dppnl'),
    ppn: document.getElementById('row-ppn'),
    total: document.getElementById('row-total'),
    pph: document.getElementById('row-pph'),
    vendor: document.getElementById('row-vendor')
  },
  badges: {
    dpp: document.getElementById('badge-dpp'),
    dppnl: document.getElementById('badge-dppnl'),
    ppn: document.getElementById('badge-ppn'),
    total: document.getElementById('badge-total'),
    pph: document.getElementById('badge-pph'),
    vendor: document.getElementById('badge-vendor')
  },
  inputs: {
    nominal: document.getElementById('input-nominal'),
    dpp: document.getElementById('input-dpp'),
    dppnl: document.getElementById('input-dppnl'),
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
  useDppNilaiLain: false,
  ppnDipungut: false,
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

  for (const key of ['dpp', 'dppnl', 'ppn', 'total', 'pph', 'vendor']) {
    const isCurrent = key === effectiveRowSource;
    dom.rows[key].classList.toggle('is-source', isCurrent);
    dom.badges[key].hidden = !isCurrent;
  }

  dom.nominalModeHint.textContent = state.includePpn
    ? 'Nominal berisi Total Tagihan (harga + PPN)'
    : 'Nominal berisi Harga sebelum pajak (DPP)';
}

function render(activeInputEl = null, autoNotice = '') {
  state.ppnRate = Number.parseFloat(dom.selectPpn.value) || 0;
  state.pphRate = getEffectivePphRate();
  state.includePpn = dom.checkIncludePpn.checked;

  const is12 = Math.abs(state.ppnRate - 0.12) < 1e-9;
  dom.checkDppNl.disabled = !is12;
  if (!is12) dom.checkDppNl.checked = false;
  state.useDppNilaiLain = dom.checkDppNl.checked;
  dom.rows.dppnl.hidden = !state.useDppNilaiLain;
  if (!state.useDppNilaiLain && state.source === 'dppnl') {
    state.source = 'dpp';
    state.value = state.lastResult ? state.lastResult.dpp : 0;
  }

  const hasPpn = state.ppnRate > 0;
  dom.checkPpnDipungut.disabled = !hasPpn;
  if (!hasPpn) dom.checkPpnDipungut.checked = false;
  state.ppnDipungut = dom.checkPpnDipungut.checked;
  dom.rowPpnWapu.hidden = !state.ppnDipungut;

  const ppnPctLabel = `(${formatPercentLabel(state.ppnRate)})`;
  dom.labelPpnRate.textContent = ppnPctLabel;
  dom.labelPpnWapuRate.textContent = ppnPctLabel;
  dom.labelPphRate.textContent = `(${formatPercentLabel(state.pphRate)})`;

  const result = calculateTax({
    source: state.source,
    value: state.value,
    ppnRate: state.ppnRate,
    pphRate: state.pphRate,
    includePpn: state.includePpn,
    useDppNilaiLain: state.useDppNilaiLain,
    ppnDipungut: state.ppnDipungut
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

  dom.prefixPpnWapu.textContent = result.ppn > 0 ? '- Rp' : 'Rp';
  dom.prefixPph.textContent = result.pph > 0 ? '- Rp' : 'Rp';

  for (const key of ['nominal', 'dpp', 'dppnl', 'ppn', 'total', 'pph', 'vendor']) {
    const inputEl = dom.inputs[key];
    if (inputEl === activeInputEl) {
      setFormattedValuePreservingCursor(inputEl, state.value);
    } else {
      inputEl.value = formatNumberId(result[key]);
    }
  }

  if (dom.inputPpnWapu === activeInputEl) {
    setFormattedValuePreservingCursor(dom.inputPpnWapu, state.value);
  } else {
    dom.inputPpnWapu.value = formatNumberId(result.ppn);
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
  render(inputEl, autoNotice);
}

for (const [key, inputEl] of Object.entries(dom.inputs)) {
  inputEl.addEventListener('input', (e) => handleAmountInput(key, e));

  inputEl.addEventListener('focus', () => {
    if (typeof window !== 'undefined' && window.innerWidth < 600) {
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

dom.inputPpnWapu.addEventListener('input', (e) => handleAmountInput('ppn', e));

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

dom.checkDppNl.addEventListener('change', () => render());
dom.checkPpnDipungut.addEventListener('change', () => render());

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

function updatePrintView(result) {
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const invDateEl = document.getElementById('inv-date');
  if (invDateEl) invDateEl.textContent = dateStr;

  const ppnStatusEl = document.getElementById('inv-ppn-status');
  if (ppnStatusEl) {
    if (state.ppnRate === 0) {
      ppnStatusEl.textContent = 'Non-PKP / Tanpa PPN';
    } else if (state.ppnDipungut) {
      ppnStatusEl.textContent = 'Dipungut Bendahara Pemerintah (WAPU)';
    } else if (state.useDppNilaiLain) {
      ppnStatusEl.textContent = 'PPN 12% (DPP Nilai Lain 11/12)';
    } else {
      ppnStatusEl.textContent = `Standar (${formatPercentLabel(state.ppnRate)})`;
    }
  }

  const wapuNoticeEl = document.getElementById('inv-wapu-notice');
  if (wapuNoticeEl) {
    if (state.ppnDipungut) {
      wapuNoticeEl.textContent = 'Transaksi dengan Bendahara Pemerintah: PPN disetor langsung oleh Bendahara ke Kas Negara. Vendor hanya menerima pembayaran netto (DPP dikurangi PPh).';
    } else {
      wapuNoticeEl.textContent = 'PPN dipungut oleh vendor untuk disetor ke Kas Negara. Potongan PPh disetor oleh pihak pembeli/pemotong.';
    }
  }

  const setTxt = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };

  const ppnLabel = `(${formatPercentLabel(state.ppnRate)})`;
  const pphLabel = `(${formatPercentLabel(state.pphRate)})`;

  setTxt('inv-cell-dpp', formatRupiah(result.dpp));
  setTxt('inv-sum-dpp', formatRupiah(result.dpp));
  setTxt('inv-sum-dppnl', formatRupiah(result.dppnl));
  setTxt('inv-sum-ppn-rate', ppnLabel);
  setTxt('inv-sum-ppn', formatRupiah(result.ppn));
  setTxt('inv-sum-total', formatRupiah(result.total));
  setTxt('inv-sum-ppn-wapu', `- ${formatRupiah(result.ppn)}`);
  setTxt('inv-sum-pph-rate', pphLabel);
  setTxt('inv-sum-pph', `- ${formatRupiah(result.pph)}`);
  setTxt('inv-sum-vendor', formatRupiah(result.vendor));

  const rowDppnl = document.getElementById('inv-row-dppnl');
  if (rowDppnl) rowDppnl.hidden = !state.useDppNilaiLain;

  const rowPpnWapu = document.getElementById('inv-row-ppn-wapu');
  if (rowPpnWapu) rowPpnWapu.hidden = !state.ppnDipungut;
}

dom.btnPrint.addEventListener('click', () => {
  if (state.lastResult) {
    updatePrintView(state.lastResult);
  }
  window.print();
});

dom.btnCopy.addEventListener('click', async () => {
  if (!state.lastResult) return;
  const r = state.lastResult;
  const ppnLabel = formatPercentLabel(state.ppnRate);
  const pphLabel = formatPercentLabel(state.pphRate);

  const summaryLines = [
    `Harga sebelum pajak (DPP): ${formatRupiah(r.dpp)}`,
    ...(state.useDppNilaiLain ? [`Dasar hitung PPN (DPP Nilai Lain): ${formatRupiah(r.dppnl)}`] : []),
    `PPN (${ppnLabel}): ${formatRupiah(r.ppn)}`,
    `Total tagihan (harga + PPN): ${formatRupiah(r.total)}`,
    ...(state.ppnDipungut ? [`PPN dipungut bendahara (${ppnLabel}): ${formatRupiah(r.ppn, true)}`] : []),
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
