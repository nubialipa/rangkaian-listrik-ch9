// Data karakter. Ringkasan kejadian ditulis ulang dengan kata sendiri (bukan salinan dari sumber),
// dan nomor "at" adalah urutan kejadian (bukan nomor episode resmi). Verifikasi dulu sebelum rilis.
var CHARACTERS = [
  {
    id: 'itachi-uchiha',
    name: 'Itachi Uchiha',
    series: 'Naruto',
    question: 'Apakah Itachi pahlawan atau penjahat?',
    events: [
      { at: 1, title: 'Pembantaian klan Uchiha', summary: 'Itachi membunuh sebagian besar klannya, termasuk orang tuanya, dan menyisakan adiknya.' },
      { at: 2, title: 'Bergabung dengan Akatsuki', summary: 'Ia masuk organisasi kriminal dengan alasan memata-matai dari dalam.' },
      { at: 3, title: 'Tsukuyomi', summary: 'Dalam genjutsu Tsukuyomi, ia menunjukkan kebahagiaan palsu kepada lawannya.' },
      { at: 4, title: 'Permintaan kepada adiknya', summary: 'Ia meminta adiknya membencinya dan membunuhnya agar adiknya bisa maju.' },
      { at: 5, title: 'Kematian', summary: 'Ia meninggal setelah membongkar sebagian rencana yang selama ini ia sembunyikan.' }
    ]
  },
  {
    id: 'light-yagami',
    name: 'Light Yagami',
    series: 'Death Note',
    question: 'Apakah Light berniat membawa keadilan atau hanya ingin berkuasa?',
    events: [
      { at: 1, title: 'Menemukan Death Note', summary: 'Ia menemukan buku yang bisa membunuh siapa pun yang namanya ditulis.' },
      { at: 2, title: 'Mulai menghukum penjahat', summary: 'Ia membunuh kriminal dan mengklaim tujuannya menciptakan dunia tanpa kejahatan.' },
      { at: 3, title: 'Perburuan dengan L', summary: 'Ia bermain kucing-kucingan dengan detektif L dan membunuh siapa pun yang menghalangi.' },
      { at: 4, title: 'Kejatuhan', summary: 'Tindakannya makin ekstrem sampai ia kehilangan dukungan dan terungkap.' }
    ]
  }
];
