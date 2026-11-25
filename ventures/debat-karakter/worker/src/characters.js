// Data karakter. Ringkasan ditulis ulang dengan kata sendiri (bukan salinan).
// `at` adalah urutan titik cerita yang disederhanakan (bukan nomor episode resmi).
// status "sumber_dirujuk": sumber sudah dikumpulkan, tetapi belum dicocokkan baris per baris.

export const CHARACTERS = [
  {
    id: 'itachi-uchiha',
    name: 'Itachi Uchiha',
    series: 'Naruto',
    question: 'Apakah Itachi pahlawan atau penjahat?',
    verification: 'sumber_dirujuk',
    sources: ['https://en.wikipedia.org/wiki/Itachi_Uchiha'],
    events: [
      { at: 1, title: 'Pembantaian klan Uchiha', summary: 'Itachi membunuh sebagian besar klan Uchiha dan membiarkan adiknya, Sasuke, tetap hidup.' },
      { at: 2, title: 'Bergabung dengan Akatsuki', summary: 'Ia bekerja sebagai anggota organisasi Akatsuki.' },
      { at: 3, title: 'Tsukuyomi terhadap Sasuke', summary: 'Dengan genjutsu Tsukuyomi, Itachi membuat Sasuke melihat ulang pembantaian orang tua mereka.' },
      { at: 4, title: 'Alasan yang tersembunyi', summary: 'Ada alasan rahasia di balik pembantaian itu yang baru terungkap kemudian.' },
      { at: 5, title: 'Duel terakhir', summary: 'Itachi tewas dalam pertarungan terakhirnya dengan Sasuke.' }
    ]
  },
  {
    id: 'light-yagami',
    name: 'Light Yagami',
    series: 'Death Note',
    question: 'Apakah Light berniat membawa keadilan atau hanya ingin berkuasa?',
    verification: 'sumber_dirujuk',
    sources: ['https://en.wikipedia.org/wiki/Light_Yagami', 'https://en.wikipedia.org/wiki/Death_Note'],
    events: [
      { at: 1, title: 'Menemukan Death Note', summary: 'Ia menemukan buku yang bisa membunuh siapa pun yang namanya ditulis di dalamnya.' },
      { at: 2, title: 'Menjadi Kira', summary: 'Ia memakai buku itu untuk menghukum orang yang ia anggap jahat, dengan tujuan dunia tanpa kejahatan.' },
      { at: 3, title: 'Melawan L', summary: 'Ia memanipulasi situasi sehingga detektif L terbunuh.' },
      { at: 4, title: 'Kejatuhan', summary: 'Ryuk menuliskan namanya di Death Note, sesuai peringatan shinigami tersebut.' }
    ]
  },
  {
    id: 'lelouch-vi-britannia',
    name: 'Lelouch vi Britannia',
    series: 'Code Geass',
    question: 'Apakah Lelouch pembebas atau tiran yang lain?',
    verification: 'sumber_dirujuk',
    sources: ['https://en.wikipedia.org/wiki/Lelouch_Lamperouge'],
    events: [
      { at: 1, title: 'Pengasingan', summary: 'Ia dikirim sebagai sandera bersama adiknya, Nunnally, setelah ibu mereka dibunuh. Ia bersumpah menghancurkan Britannia.' },
      { at: 2, title: 'Mendapat Geass', summary: 'Ia mendapatkan kekuatan Geass dari penyihir C.C.' },
      { at: 3, title: 'Menjadi Zero', summary: 'Dengan topeng Zero, ia memimpin pemberontakan melawan Britannia.' },
      { at: 4, title: 'Suzaku dan Lancelot', summary: 'Suzaku diam-diam menjadi pilot Lancelot, prototipe Knightmare milik Britannia.' }
    ]
  },
  {
    id: 'walter-white',
    name: 'Walter White',
    series: 'Breaking Bad',
    question: 'Apakah Walter White menjadi jahat karena keadaan, atau memang pilihannya sendiri?',
    verification: 'sumber_dirujuk',
    sources: ['https://en.wikipedia.org/wiki/Walter_White_(Breaking_Bad)'],
    events: [
      { at: 1, title: 'Guru kimia yang terjepit', summary: 'Ia guru kimia SMA dengan utang dan pekerjaan yang tidak sesuai kemampuannya. Ia juga didiagnosis kanker.' },
      { at: 2, title: 'Mulai memproduksi narkoba', summary: 'Bersama Jesse Pinkman, ia mulai membuat metamfetamin.' },
      { at: 3, title: 'Membunuh Krazy-8', summary: 'Di awal serial, ia membunuh Krazy-8 dan mulai melewati batas moralnya.' },
      { at: 4, title: 'Motif pribadi', summary: 'Ia mengakui bahwa tindakannya bukan demi keluarga, melainkan demi kepuasannya sendiri.' },
      { at: 5, title: 'Usaha menebus', summary: 'Di episode terakhir ia mencoba menebus sebagian kesalahannya.' }
    ]
  }
];

export function findCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || null;
}

export function maxAtOf(character) {
  return Math.max(...character.events.map((e) => e.at));
}

// Ringkasan publik untuk daftar karakter.
export function publicCharacterMeta(c) {
  return { id: c.id, name: c.name, series: c.series, question: c.question, maxAt: maxAtOf(c), verification: c.verification };
}
