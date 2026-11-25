// Logika kelayakan PPh Final 0,5% UMKM berdasarkan PP 20/2026.
// Fungsi murni tanpa DOM supaya bisa diuji dengan node.
//
// PERINGATAN: ini alat bantu estimasi, bukan nasihat pajak.
// Selalu verifikasi di situs resmi DJP (pajak.go.id) sebelum melapor.

(function (root) {
  var LIMIT_TURNOVER = 4800000000; // Rp4,8 miliar per tahun
  var NO_TAX_TURNOVER = 500000000; // Rp500 juta per tahun, tarif 0%
  var COOP_MAX_YEARS = 4;          // batas tahun pajak untuk koperasi
  var RATE = 0.005;

  var ENTITIES = {
    orang_pribadi: 'Orang pribadi',
    pt_perorangan: 'PT perorangan (didirikan satu orang)',
    koperasi: 'Koperasi',
    cv_firma_pt: 'CV, firma, atau PT dengan lebih dari satu pemilik'
  };

  // Profesi yang dikecualikan menurut sumber pemberitaan PP 20/2026.
  var EXCLUDED_PROFESSIONS = {
    atlet: 'Atlet',
    penasihat: 'Penasihat',
    guru: 'Guru',
    pelatih: 'Pelatih',
    pendakwah: 'Pendakwah / penceramah',
    moderator: 'Moderator',
    penjual_keliling: 'Penjual keliling (door-to-door)',
    agen_asuransi: 'Agen asuransi',
    distributor_mlm: 'Distributor multi-level marketing',
    dokter: 'Dokter',
    selebgram: 'Selebgram / influencer'
  };

  function rupiah(n) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  // input: { entity, excludedProfession (string key or ''), turnover (number), coopYearsUsed (number) }
  function evaluate(input) {
    var reasons = [];
    var notes = [];
    var turnover = Number(input.turnover);

    if (!isFinite(turnover) || turnover < 0) {
      return { valid: false, error: 'Omzet bruto harus berupa angka nol atau lebih.' };
    }
    if (!ENTITIES[input.entity]) {
      return { valid: false, error: 'Jenis wajib pajak tidak dikenal.' };
    }

    if (turnover > LIMIT_TURNOVER) {
      reasons.push('Omzet bruto di atas Rp4,8 miliar per tahun.');
    }
    if (input.excludedProfession) {
      reasons.push('Profesi ' + (EXCLUDED_PROFESSIONS[input.excludedProfession] || input.excludedProfession) +
        ' tidak termasuk penerima PPh Final 0,5%.');
    }
    if (input.entity === 'cv_firma_pt') {
      reasons.push('CV, firma, dan PT dengan lebih dari satu pemilik tidak lagi menerima tarif ini setelah masa transisi.');
      notes.push('Jika masih dalam masa transisi, periksa tanggal dan aturan transisi di pajak.go.id.');
    }
    if (input.entity === 'koperasi') {
      var used = Number(input.coopYearsUsed) || 0;
      if (used >= COOP_MAX_YEARS) {
        reasons.push('Koperasi hanya dapat memakai tarif ini paling lama ' + COOP_MAX_YEARS + ' tahun pajak sejak terdaftar.');
      } else {
        notes.push('Koperasi: sisa masa pemakaian tarif ini ' + (COOP_MAX_YEARS - used) + ' tahun pajak.');
      }
    }

    var eligible = reasons.length === 0;
    var estimatedTax = null;
    if (eligible) {
      // Estimasi sederhana: 0% jika omzet sampai Rp500 juta per tahun,
      // selain itu 0,5% dari omzet bruto. Aturan rinci perhitungan
      // (misalnya per bulan) belum diverifikasi di sini.
      estimatedTax = turnover <= NO_TAX_TURNOVER ? 0 : Math.round(turnover * RATE);
      notes.push('Estimasi ini sederhana dan belum memperhitungkan aturan bulanan atau kondisi khusus.');
    }

    return {
      valid: true,
      eligible: eligible,
      reasons: reasons,
      notes: notes,
      estimatedTax: estimatedTax,
      estimatedTaxText: estimatedTax === null ? '-' : rupiah(estimatedTax)
    };
  }

  var api = {
    evaluate: evaluate,
    ENTITIES: ENTITIES,
    EXCLUDED_PROFESSIONS: EXCLUDED_PROFESSIONS,
    LIMIT_TURNOVER: LIMIT_TURNOVER,
    NO_TAX_TURNOVER: NO_TAX_TURNOVER,
    COOP_MAX_YEARS: COOP_MAX_YEARS,
    rupiah: rupiah
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.PphRules = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
