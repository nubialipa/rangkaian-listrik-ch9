(function () {
  var L = window.DebatLogic;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'debat-karakter-v1';

  // Penyimpanan lokal dibungkus try/catch: mode privat atau site data yang diblokir tidak boleh membuat halaman gagal.
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* abaikan */ }
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var state = load();
  state.progress = state.progress || {};   // { charId: episode terakhir yang ditandai }
  state.args = state.args || {};           // { charId: [argumen] }
  state.voted = state.voted || {};         // { argId: true }
  var current = CHARACTERS[0].id;

  function character() { return CHARACTERS.filter(function (c) { return c.id === current; })[0]; }

  function renderSelect() {
    $('char').innerHTML = CHARACTERS.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === current ? ' selected' : '') + '>' + esc(c.name) + ' (' + esc(c.series) + ')</option>';
    }).join('');
    var c = character();
    var maxAt = Math.max.apply(null, c.events.map(function (e) { return e.at; }));
    var p = state.progress[c.id] || 0;
    $('progress').max = maxAt;
    $('progress').value = p;
    $('progressLabel').textContent = 'Sudah sampai titik ' + p + ' dari ' + maxAt;
    $('question').textContent = c.question;
  }

  function renderTimeline() {
    var c = character();
    var p = state.progress[c.id] || 0;
    var shown = L.visibleEvents(c, p);
    var hidden = c.events.length - shown.length;
    var html = shown.map(function (ev) {
      return '<li><strong>' + esc(ev.title) + '</strong> (titik ' + ev.at + ')<br>' + esc(ev.summary) + '</li>';
    }).join('');
    if (hidden > 0) html += '<li class="muted">' + hidden + ' kejadian lagi disembunyikan agar tidak ada spoiler.</li>';
    $('timeline').innerHTML = html || '<li class="muted">Belum ada kejadian yang terbuka.</li>';
  }

  function renderDebate() {
    var c = character();
    var args = (state.args[c.id] || []).slice();
    var sorted = L.sortArguments(args);
    var s = L.summarizeDebate(args);
    var verdict = s.leading === 'seimbang'
      ? 'Suara masih seimbang.'
      : 'Suara saat ini condong ke ' + (s.leading === 'pro' ? 'PRO' : 'KONTRA') + '.';
    $('verdict').textContent = 'Pro: ' + s.pro + ' argumen (' + s.proVotes + ' suara) · Kontra: ' + s.kontra + ' argumen (' + s.kontraVotes + ' suara). ' + verdict;

    $('args').innerHTML = sorted.length ? sorted.map(function (a) {
      var voted = state.voted[a.id];
      return '<li class="arg">' +
        '<div class="meta">' + (a.stance === 'pro' ? 'PRO' : 'KONTRA') + ' · rujukan titik ' + a.ref + '</div>' +
        '<p>' + esc(a.text) + '</p>' +
        '<button data-vote="' + a.id + '"' + (voted ? ' disabled' : '') + '>' + (a.votes || 0) + ' suara' + (voted ? ' (kamu sudah memilih)' : ' · dukung') + '</button>' +
        '</li>';
    }).join('') : '<li class="muted">Belum ada argumen. Jadilah yang pertama.</li>';
  }

  function render() { renderSelect(); renderTimeline(); renderDebate(); }

  $('char').addEventListener('change', function () { current = this.value; render(); });

  $('progress').addEventListener('input', function () {
    var c = character();
    state.progress[c.id] = Number(this.value);
    save(state);
    renderSelect(); renderTimeline();
  });

  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    var c = character();
    var arg = {
      id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      stance: $('stance').value,
      ref: Number($('ref').value),
      text: $('text').value.trim(),
      votes: 0,
      createdAt: Date.now()
    };
    var check = L.validateArgument(c, arg);
    if (!check.valid) { $('err').textContent = check.errors.join(' '); return; }
    $('err').textContent = '';
    state.args[c.id] = (state.args[c.id] || []).concat([arg]);
    save(state);
    $('text').value = '';
    renderDebate();
  });

  $('args').addEventListener('click', function (e) {
    var id = e.target && e.target.getAttribute && e.target.getAttribute('data-vote');
    if (!id || state.voted[id]) return;
    var c = character();
    state.args[c.id] = state.args[c.id].map(function (a) {
      if (a.id === id) a.votes = (a.votes || 0) + 1;
      return a;
    });
    state.voted[id] = true;
    save(state);
    renderDebate();
  });

  // Isi pilihan rujukan sesuai episode karakter aktif.
  var c0 = character();
  var maxRef = Math.max.apply(null, c0.events.map(function (e) { return e.at; }));
  var refHtml = '';
  for (var i = 1; i <= maxRef; i++) refHtml += '<option value="' + i + '">Titik ' + i + '</option>';
  $('ref').innerHTML = refHtml;

  render();
})();
