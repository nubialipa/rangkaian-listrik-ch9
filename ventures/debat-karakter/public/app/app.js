// Antarmuka Sidang Karakter. Semua teks dari server dirender dengan textContent (bukan innerHTML).
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const GUEST_KEY = 'sk-guest-progress';

  const state = { me: null, characters: [], current: null, detail: null, mode: 'login' };

  // ---------- util ----------

  function h(tag, props, children) {
    const n = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v === undefined || v === null) continue;
        if (k === 'disabled' || k === 'hidden') n[k] = !!v;
        else if (v === false) continue;
        else if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (const c of children || []) if (c) n.append(c);
    return n;
  }

  async function api(method, path, body) {
    const opts = { method, credentials: 'same-origin', headers: {} };
    if (body !== undefined) {
      opts.headers['content-type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(path, opts);
    let data = {};
    try { data = await res.json(); } catch (_) { /* respons kosong */ }
    if (!res.ok) throw new Error(data.error || 'Permintaan gagal. Coba lagi.');
    return data;
  }

  // Progres tamu disimpan di perangkat (bukan di server). Semua akses dibungkus try/catch.
  function guestProgress() {
    try { return JSON.parse(localStorage.getItem(GUEST_KEY) || '{}') || {}; } catch (_) { return {}; }
  }
  function setGuestProgress(charId, at) {
    try {
      const all = guestProgress();
      all[charId] = at;
      localStorage.setItem(GUEST_KEY, JSON.stringify(all));
    } catch (_) { /* penyimpanan diblokir: progres hanya berlaku selama halaman terbuka */ }
  }

  // ---------- akun ----------

  function renderAccount() {
    const box = $('account');
    box.textContent = '';
    if (state.me) {
      box.append(
        h('span', { class: 'muted', text: 'Masuk sebagai ' }),
        h('strong', { text: state.me.username }),
        ' ',
        h('button', { class: 'ghost small-btn', type: 'button', text: 'Keluar', onclick: logout })
      );
    } else {
      box.append(h('button', { class: 'small-btn', type: 'button', text: 'Masuk / Daftar', onclick: () => showAuth('login') }));
    }
    if (state.me) $('authBox').hidden = true;
  }

  function showAuth(mode) {
    state.mode = mode;
    $('authBox').hidden = false;
    $('authTitle').textContent = mode === 'login' ? 'Masuk' : 'Daftar akun baru';
    $('authSubmit').textContent = mode === 'login' ? 'Masuk' : 'Daftar';
    $('authToggle').textContent = mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk';
    $('authErr').textContent = '';
    $('username').focus();
  }

  async function submitAuth(e) {
    e.preventDefault();
    $('authErr').textContent = '';
    const username = $('username').value.trim().toLowerCase();
    const password = $('password').value;
    try {
      const path = state.mode === 'login' ? '/api/login' : '/api/register';
      const data = await api('POST', path, { username, password });
      state.me = data.user;
      await migrateGuestProgress();
      $('password').value = '';
      $('authBox').hidden = true;
      renderAccount();
      await loadDetail();
    } catch (err) {
      $('authErr').textContent = err.message;
    }
  }

  // Progres yang sudah dibuka sebagai tamu dipindahkan ke akun setelah masuk atau mendaftar.
  async function migrateGuestProgress() {
    const all = guestProgress();
    for (const [charId, at] of Object.entries(all)) {
      if (!at) continue;
      try {
        await api('PUT', `/api/characters/${charId}/progress`, { at: Number(at) });
      } catch (_) { /* batas nilai bisa berubah; lewati saja */ }
    }
    try { localStorage.removeItem(GUEST_KEY); } catch (_) { /* abaikan */ }
  }

  async function logout() {
    try { await api('POST', '/api/logout'); } catch (_) { /* abaikan */ }
    state.me = null;
    renderAccount();
    await loadDetail();
  }

  // ---------- karakter & kronologi ----------

  async function loadCharacters() {
    const data = await api('GET', '/api/characters');
    state.characters = data.characters;
    $('char').textContent = '';
    for (const c of state.characters) {
      $('char').append(h('option', { value: c.id, text: `${c.name} (${c.series})` }));
    }
    state.current = state.characters[0] ? state.characters[0].id : null;
  }

  function currentMeta() {
    return state.characters.find((c) => c.id === state.current);
  }

  function myProgressValue() {
    if (state.me && state.detail) return state.detail.progress ?? 0;
    return guestProgress()[state.current] ?? 0;
  }

  async function loadDetail() {
    if (!state.current) return;
    const meta = currentMeta();
    const q = state.me ? '' : `?at=${encodeURIComponent(guestProgress()[state.current] ?? 0)}`;
    try {
      state.detail = await api('GET', `/api/characters/${state.current}${q}`);
    } catch (err) {
      $('verdict').textContent = err.message;
      return;
    }
    renderAll(meta);
  }

  function renderAll(meta) {
    const d = state.detail;
    $('question').textContent = meta.question;
    const note = $('sourceNote');
    note.textContent = '';
    note.append(d.character.verification === 'sumber_dirujuk'
      ? 'Sumber ringkasan, belum dicocokkan baris per baris: '
      : 'Kronologi ini belum diverifikasi. ');
    d.sources.forEach((url, i) => {
      if (i > 0) note.append(', ');
      note.append(h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', text: new URL(url).hostname.replace(/^www\./, '') }));
    });

    const progress = myProgressValue();
    $('progress').max = meta.maxAt;
    $('progress').value = progress;
    $('progressLabel').textContent = `Titik ${progress} dari ${meta.maxAt}`;
    $('progressHint').textContent = state.me
      ? 'Progres disimpan ke akunmu.'
      : 'Sebagai tamu, progres hanya disimpan di perangkat ini. Masuk untuk menyimpannya ke akun.';

    renderTimeline(d);
    renderArguments(d);
    renderRefOptions(meta, progress);
  }

  function renderTimeline(d) {
    const ul = $('timeline');
    ul.textContent = '';
    if (!d.events.length) ul.append(h('li', { class: 'muted', text: 'Belum ada kejadian yang terbuka. Geser progres untuk membukanya.' }));
    for (const ev of d.events) {
      ul.append(h('li', null, [
        h('strong', { text: ev.title }),
        h('span', { class: 'badge', text: `  titik ${ev.at}` }),
        h('p', { class: 'arg-text tight', text: ev.summary }),
      ]));
    }
    if (d.hiddenEvents > 0) {
      ul.append(h('li', { class: 'muted small', text: `${d.hiddenEvents} kejadian lain disembunyikan agar tidak ada spoiler.` }));
    }
  }

  function renderArguments(d) {
    const s = d.summary;
    const verdict = s.leading === 'seimbang'
      ? 'Suara masih seimbang.'
      : `Suara saat ini condong ke ${s.leading === 'pro' ? 'PRO' : 'KONTRA'}.`;
    $('verdict').textContent =
      `Pro: ${s.pro} argumen (${s.proVotes} suara) · Kontra: ${s.kontra} argumen (${s.kontraVotes} suara). ${verdict}`;
    const total = s.proVotes + s.kontraVotes;
    $('barPro').style.width = total ? `${(s.proVotes / total) * 100}%` : '0%';
    $('barKontra').style.width = total ? `${(s.kontraVotes / total) * 100}%` : '0%';

    const ul = $('args');
    ul.textContent = '';
    if (!d.arguments.length) {
      ul.append(h('li', { class: 'muted', text: 'Belum ada argumen untuk kejadian yang terbuka. Jadilah yang pertama.' }));
      return;
    }
    for (const a of d.arguments) {
      const canVote = state.me && !a.mine && !a.voted;
      const actions = h('div', { class: 'arg-actions' }, [
        h('button', {
          class: 'small-btn ghost', type: 'button', disabled: !canVote,
          text: a.voted ? `${a.votes} suara (sudah kamu pilih)` : `${a.votes} suara · dukung`,
          onclick: () => vote(a.id),
        }),
        state.me && !a.mine
          ? h('button', { class: 'small-btn ghost', type: 'button', text: 'Laporkan', onclick: () => report(a.id) })
          : null,
      ]);
      ul.append(h('li', { class: 'arg' }, [
        h('div', { class: 'arg-actions' }, [
          h('span', { class: `tag ${a.stance}`, text: a.stance === 'pro' ? 'PRO' : 'KONTRA' }),
          h('span', { class: 'badge', text: `rujukan titik ${a.ref} · oleh ${a.author}` }),
        ]),
        h('p', { class: 'arg-text', text: a.text }),
        actions,
      ]));
    }
  }

  function renderRefOptions(meta, progress) {
    const sel = $('ref');
    const prev = sel.value;
    sel.textContent = '';
    const max = Math.min(progress, meta.maxAt);
    for (let i = 1; i <= max; i++) sel.append(h('option', { value: String(i), text: `Titik ${i}` }));
    if (prev && Number(prev) <= max) sel.value = prev;
    const canPost = max >= 1;
    $('argSubmit').disabled = !canPost || !state.me;
    $('argErr').textContent = '';
    $('argHint').textContent = !state.me
      ? 'Masuk untuk ikut berdebat. Progres tamu tetap bisa dilihat di perangkat ini.'
      : (!canPost ? 'Geser progres ke minimal titik 1 untuk menulis argumen.' : '');
  }

  // ---------- aksi ----------

  async function onProgressChange() {
    const at = Number($('progress').value);
    if (state.me) {
      try {
        await api('PUT', `/api/characters/${state.current}/progress`, { at });
      } catch (err) {
        $('argErr').textContent = err.message;
      }
    } else {
      setGuestProgress(state.current, at);
    }
    await loadDetail();
  }

  async function postArgument(e) {
    e.preventDefault();
    $('argErr').textContent = '';
    try {
      await api('POST', `/api/characters/${state.current}/arguments`, {
        stance: $('stance').value,
        ref: Number($('ref').value),
        text: $('text').value,
      });
      $('text').value = '';
      $('counter').textContent = '0 / 600';
      await loadDetail();
    } catch (err) {
      $('argErr').textContent = err.message;
    }
  }

  async function vote(argId) {
    try {
      await api('POST', `/api/arguments/${argId}/vote`);
      await loadDetail();
    } catch (err) {
      alert(err.message);
    }
  }

  async function report(argId) {
    if (!confirm('Laporkan argumen ini sebagai tidak pantas atau tidak relevan?')) return;
    try {
      await api('POST', `/api/arguments/${argId}/report`);
      await loadDetail();
    } catch (err) {
      alert(err.message);
    }
  }

  // ---------- init ----------

  async function init() {
    try {
      const me = await api('GET', '/api/me');
      state.me = me.user;
    } catch (_) {
      state.me = null;
    }
    await loadCharacters();
    renderAccount();

    $('char').addEventListener('change', async (e) => {
      state.current = e.target.value;
      await loadDetail();
    });
    $('progress').addEventListener('change', onProgressChange);
    $('progress').addEventListener('input', () => {
      $('progressLabel').textContent = `Titik ${$('progress').value} dari ${currentMeta().maxAt}`;
    });
    $('authForm').addEventListener('submit', submitAuth);
    $('authToggle').addEventListener('click', () => showAuth(state.mode === 'login' ? 'register' : 'login'));
    $('argForm').addEventListener('submit', postArgument);
    $('text').addEventListener('input', () => {
      $('counter').textContent = `${$('text').value.length} / 600`;
    });

    await loadDetail();
  }

  init();
})();
