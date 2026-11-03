const PPN_OPTIONS = [
  { id: '11', label: '11%', rate: 0.11 },
  { id: '12', label: '12%', rate: 0.12 },
  { id: '1.1', label: '1,1% (Besaran Tertentu)', rate: 0.011 },
  { id: '0', label: '0% (Tanpa PPN)', rate: 0 }
];

const PPH_OPTIONS = [
  { id: 'pph23_jasa', label: 'PPh 23 - Jasa (2%)', rate: 0.02 },
  { id: 'pph23_non_npwp', label: 'PPh 23 - Jasa Tanpa NPWP (4%)', rate: 0.04 },
  { id: 'pph23_modal', label: 'PPh 23 - Dividen / Bunga / Royalti (15%)', rate: 0.15 },
  { id: 'pph4_umkm', label: 'PPh Final 4(2) - UMKM PP 55 (0,5%)', rate: 0.005 },
  { id: 'pph4_konst_kecil', label: 'PPh Final 4(2) - Konstruksi Kecil (1,75%)', rate: 0.0175 },
  { id: 'pph4_konst_menengah', label: 'PPh Final 4(2) - Konstruksi Menengah/Besar (2,65%)', rate: 0.0265 },
  { id: 'pph4_konst_konsultan', label: 'PPh Final 4(2) - Konsultan Konstruksi (3,5%)', rate: 0.035 },
  { id: 'pph4_sewa', label: 'PPh Final 4(2) - Sewa Tanah/Bangunan (10%)', rate: 0.10 },
  { id: 'pph21_tenaga_ahli', label: 'PPh 21 - Tenaga Ahli / Bukan Pegawai (2,5%)', rate: 0.025 },
  { id: 'none', label: 'Tanpa Potongan PPh (0%)', rate: 0 },
  { id: 'custom', label: 'Tarif PPh Kustom (%)', rate: null }
];

const DPP_NILAI_LAIN_FACTOR = 11 / 12;

const idNumberFormat = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0
});

function formatNumberId(value) {
  const num = Math.round(Number(value) || 0);
  return idNumberFormat.format(Math.max(0, num));
}

function formatRupiah(value, isDeduction = false) {
  const num = Math.round(Number(value) || 0);
  if (isDeduction && num > 0) {
    return `- Rp ${idNumberFormat.format(num)}`;
  }
  return `Rp ${idNumberFormat.format(Math.max(0, num))}`;
}

function parseRupiahInput(rawString) {
  if (typeof rawString === 'number') {
    return Number.isFinite(rawString) && rawString >= 0 ? Math.round(rawString) : 0;
  }
  const digits = String(rawString || '').replace(/[^\d]/g, '');
  if (!digits) return 0;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? Math.min(parsed, 999_999_999_999_999) : 0;
}

/*
 * Dengan DPP Nilai Lain, PPN = tarif x (11/12 x DPP). PPh tetap dihitung dari DPP
 * (harga jual sebenarnya). Tanpa opsi itu, faktor = 1 dan dppNilaiLain sama dengan DPP.
 */
function calculateTax({
  source = 'nominal',
  value = 0,
  ppnRate = 0.11,
  pphRate = 0.02,
  includePpn = false,
  useDppNilaiLain = false
}) {
  const cleanValue = Math.max(0, Math.round(Number(value) || 0));
  const rPpn = Math.max(0, Number(ppnRate) || 0);
  const rPph = Math.max(0, Number(pphRate) || 0);
  const factor = useDppNilaiLain ? DPP_NILAI_LAIN_FACTOR : 1;
  const effRate = rPpn * factor;

  if (rPph >= 1 + effRate) {
    return {
      error: 'Tarif potongan PPh tidak boleh melebihi total tagihan (100% + PPN).',
      nominal: 0,
      dpp: 0,
      dppnl: 0,
      ppn: 0,
      total: 0,
      pph: 0,
      vendor: 0
    };
  }

  const dppNlOf = (dpp) => Math.round(dpp * factor);
  const ppnOf = (dpp) => Math.round(dppNlOf(dpp) * rPpn);

  const effectiveSource =
    source === 'nominal' ? (includePpn ? 'total' : 'dpp') : source;

  let dpp = 0;
  let ppn = 0;
  let total = 0;
  let pph = 0;
  let vendor = 0;

  if (effectiveSource === 'dpp') {
    dpp = cleanValue;
    ppn = ppnOf(dpp);
    total = dpp + ppn;
    pph = Math.round(dpp * rPph);
    vendor = total - pph;
  } else if (effectiveSource === 'dppnl') {
    dpp = Math.round(cleanValue / factor);
    ppn = ppnOf(dpp);
    total = dpp + ppn;
    pph = Math.round(dpp * rPph);
    vendor = total - pph;
  } else if (effectiveSource === 'total') {
    total = cleanValue;
    dpp = effRate > 0 ? Math.round(total / (1 + effRate)) : total;
    ppn = total - dpp;
    pph = Math.round(dpp * rPph);
    vendor = total - pph;
  } else if (effectiveSource === 'ppn') {
    ppn = cleanValue;
    dpp = effRate > 0 ? Math.round(ppn / effRate) : 0;
    total = dpp + ppn;
    pph = Math.round(dpp * rPph);
    vendor = total - pph;
  } else if (effectiveSource === 'pph') {
    pph = cleanValue;
    dpp = rPph > 0 ? Math.round(pph / rPph) : 0;
    ppn = ppnOf(dpp);
    total = dpp + ppn;
    vendor = total - pph;
  } else if (effectiveSource === 'vendor') {
    vendor = cleanValue;
    const netFactor = 1 + effRate - rPph;
    const approxDpp = Math.round(vendor / netFactor);

    let matched = false;
    for (let offset = 0; offset <= 2; offset++) {
      const candidates = offset === 0 ? [approxDpp] : [approxDpp - offset, approxDpp + offset];
      for (const cand of candidates) {
        if (cand < 0) continue;
        const candPpn = ppnOf(cand);
        const candPph = Math.round(cand * rPph);
        if (cand + candPpn - candPph === vendor) {
          dpp = cand;
          ppn = candPpn;
          total = dpp + ppn;
          pph = candPph;
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    if (!matched) {
      dpp = Math.max(0, approxDpp);
      if (rPph > 0) {
        ppn = ppnOf(dpp);
        total = dpp + ppn;
        pph = Math.max(0, total - vendor);
      } else {
        pph = 0;
        ppn = Math.max(0, vendor - dpp);
        total = dpp + ppn;
      }
    }
  }

  const nominal = includePpn ? total : dpp;

  return {
    error: null,
    nominal,
    dpp,
    dppnl: dppNlOf(dpp),
    ppn,
    total,
    pph,
    vendor
  };
}

const TaxCalculatorAPI = {
  PPN_OPTIONS,
  PPH_OPTIONS,
  formatNumberId,
  formatRupiah,
  parseRupiahInput,
  calculateTax
};

if (typeof globalThis !== 'undefined') {
  globalThis.TaxCalculator = TaxCalculatorAPI;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TaxCalculatorAPI;
}
