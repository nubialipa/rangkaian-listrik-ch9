// Logika murni untuk Debat & Analisis Karakter. Tanpa DOM, bisa diuji dengan node.
(function (root) {
  // Hanya tampilkan kejadian yang sudah dicapai pengguna (anti-spoiler).
  // progress = nomor episode/bab terakhir yang sudah ditandai ditonton/dibaca.
  function visibleEvents(character, progress) {
    var p = Number(progress) || 0;
    return character.events.filter(function (ev) { return ev.at <= p; });
  }

  // Argumen valid: punya posisi, teks, dan rujukan episode yang ada di karakter.
  function validateArgument(character, arg) {
    var errors = [];
    if (arg.stance !== 'pro' && arg.stance !== 'kontra') errors.push('Pilih pro atau kontra.');
    if (!arg.text || arg.text.trim().length < 20) errors.push('Argumen minimal 20 karakter.');
    if (arg.text && arg.text.length > 600) errors.push('Argumen maksimal 600 karakter.');
    var ref = Number(arg.ref);
    var maxAt = Math.max.apply(null, character.events.map(function (e) { return e.at; }));
    if (!ref || ref < 1 || ref > maxAt) errors.push('Sebutkan episode rujukan yang valid.');
    return { valid: errors.length === 0, errors: errors };
  }

  // Ringkasan papan debat: jumlah pro/kontra dan skor berdasarkan suara.
  function summarizeDebate(args) {
    var pro = 0, kontra = 0, proVotes = 0, kontraVotes = 0;
    args.forEach(function (a) {
      var v = Number(a.votes) || 0;
      if (a.stance === 'pro') { pro++; proVotes += v; }
      else if (a.stance === 'kontra') { kontra++; kontraVotes += v; }
    });
    var leading = proVotes === kontraVotes ? 'seimbang' : (proVotes > kontraVotes ? 'pro' : 'kontra');
    return { pro: pro, kontra: kontra, proVotes: proVotes, kontraVotes: kontraVotes, leading: leading };
  }

  // Urutkan argumen: suara terbanyak dulu, lalu yang terbaru.
  function sortArguments(args) {
    return args.slice().sort(function (a, b) {
      if ((b.votes || 0) !== (a.votes || 0)) return (b.votes || 0) - (a.votes || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  var api = { visibleEvents: visibleEvents, validateArgument: validateArgument,
    summarizeDebate: summarizeDebate, sortArguments: sortArguments };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DebatLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
