(function () {
  var R = window.PphRules;
  var $ = function (id) { return document.getElementById(id); };

  function fillSelect(sel, map, emptyLabel) {
    var html = '';
    if (emptyLabel) html += '<option value="">' + emptyLabel + '</option>';
    Object.keys(map).forEach(function (k) {
      html += '<option value="' + k + '">' + map[k] + '</option>';
    });
    sel.innerHTML = html;
  }

  fillSelect($('entity'), R.ENTITIES);
  fillSelect($('profession'), R.EXCLUDED_PROFESSIONS, 'Bukan profesi di atas');

  $('entity').addEventListener('change', function () {
    $('coopWrap').hidden = this.value !== 'koperasi';
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  $('f').addEventListener('submit', function (e) {
    e.preventDefault();
    $('err').textContent = '';
    var turnoverRaw = $('turnover').value.trim();
    if (turnoverRaw === '') {
      $('err').textContent = 'Isi omzet bruto terlebih dahulu.';
      return;
    }

    var r = R.evaluate({
      entity: $('entity').value,
      excludedProfession: $('profession').value,
      turnover: Number(turnoverRaw),
      coopYearsUsed: $('coopYears').value
    });

    var out = $('out');
    out.hidden = false;
    if (!r.valid) {
      out.innerHTML = '<p class="no">' + esc(r.error) + '</p>';
      return;
    }

    var head = r.eligible
      ? '<h2 class="ok">Kemungkinan besar memenuhi syarat</h2>'
      : '<h2 class="no">Tidak memenuhi syarat PPh Final 0,5%</h2>';

    var body = '';
    if (r.eligible) {
      body += '<p>Estimasi PPh Final: <strong>' + esc(r.estimatedTaxText) + '</strong> per tahun.</p>';
    }
    if (r.reasons.length) {
      body += '<p>Alasan:</p><ul>' + r.reasons.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    }
    if (r.notes.length) {
      body += '<ul>' + r.notes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    }
    out.innerHTML = head + body;
  });
})();
