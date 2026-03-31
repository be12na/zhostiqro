import { SHEET_NAMES } from './constants.js';

const SEED_DATA = {
  [SHEET_NAMES.APP_CONFIG]: [
    { config_key: 'app_name', config_value: 'Aplikasi Buku Iqro 1-6 Lengkap', description: 'Nama aplikasi utama' },
    {
      config_key: 'app_description',
      config_value: 'Belajar mengaji dengan materi terstruktur dan mudah dipahami',
      description: 'Deskripsi singkat aplikasi'
    },
    {
      config_key: 'apps_script_web_app_url',
      config_value:
        'https://script.google.com/macros/s/AKfycbys4jJPffF0zqCZDGp-mXSwkF25DGxBrPVC9p-zeWKocK8wdA5vys-lTxUa5G3cCxOuRw/exec',
      description: 'Endpoint Web App Apps Script'
    }
  ],
  [SHEET_NAMES.CATEGORIES]: [
    {
      category_id: 'cat_iqro_1',
      category_name: 'Iqro 1',
      category_slug: 'iqro-1',
      description: 'Pengenalan huruf hijaiyah dasar',
      icon_name: 'book-open',
      sort_order: '1',
      is_active: 'TRUE'
    },
    {
      category_id: 'cat_iqro_2',
      category_name: 'Iqro 2',
      category_slug: 'iqro-2',
      description: 'Latihan harakat dasar',
      icon_name: 'book-open',
      sort_order: '2',
      is_active: 'TRUE'
    },
    {
      category_id: 'cat_doa',
      category_name: 'Doa Harian',
      category_slug: 'doa-harian',
      description: 'Kumpulan doa harian pilihan',
      icon_name: 'prayer',
      sort_order: '8',
      is_active: 'TRUE'
    },
    {
      category_id: 'cat_quran',
      category_name: 'Al-Quran',
      category_slug: 'al-quran',
      description: 'Daftar surat pendek untuk latihan',
      icon_name: 'book-quran',
      sort_order: '9',
      is_active: 'TRUE'
    }
  ],
  [SHEET_NAMES.MATERIALS]: [
    {
      material_id: 'mat_iqro1_001',
      category_id: 'cat_iqro_1',
      title: 'Huruf Alif Ba Ta',
      subtitle: 'Pengenalan huruf awal',
      content_arab: 'ا ب ت',
      content_latin: 'Alif Ba Ta',
      content_translation: 'Pengenalan tiga huruf hijaiyah pertama',
      lesson_type: 'iqro',
      level_name: 'Pemula',
      image_url: '',
      audio_url: '',
      page_number: '1',
      sort_order: '1',
      is_featured: 'TRUE',
      is_active: 'TRUE'
    },
    {
      material_id: 'mat_iqro2_001',
      category_id: 'cat_iqro_2',
      title: 'Harakat Fathah',
      subtitle: 'Bacaan bunyi a',
      content_arab: 'بَ تَ ثَ',
      content_latin: 'Ba Ta Tsa',
      content_translation: 'Dasar membaca huruf dengan fathah',
      lesson_type: 'iqro',
      level_name: 'Dasar',
      image_url: '',
      audio_url: '',
      page_number: '3',
      sort_order: '1',
      is_featured: 'TRUE',
      is_active: 'TRUE'
    }
  ],
  [SHEET_NAMES.DAILY_PRAYERS]: [
    {
      prayer_id: 'prayer_001',
      title: 'Doa Sebelum Makan',
      arabic_text: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',
      latin_text: 'Allahumma barik lana fima razaqtana wa qina adzaban nar',
      translation_text: 'Ya Allah berkahilah rezeki kami dan lindungi kami dari azab neraka',
      source_reference: 'H.R. Tirmidzi',
      category_tag: 'makan',
      sort_order: '1',
      is_active: 'TRUE'
    }
  ],
  [SHEET_NAMES.DZIKIR]: [
    {
      dzikir_id: 'dzikir_001',
      dzikir_type: 'pagi',
      title: 'Ayat Kursi',
      arabic_text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
      latin_text: 'Allahu la ilaha illa huwal hayyul qayyum',
      translation_text: 'Allah tidak ada tuhan selain Dia Yang Maha Hidup lagi Maha Berdiri sendiri',
      source_reference: 'H.R. An Nasai',
      repeat_count: '1',
      sort_order: '1',
      is_active: 'TRUE'
    },
    {
      dzikir_id: 'dzikir_004',
      dzikir_type: 'petang',
      title: 'Ayat Kursi',
      arabic_text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
      latin_text: 'Allahu la ilaha illa huwal hayyul qayyum',
      translation_text: 'Allah tidak ada tuhan selain Dia Yang Maha Hidup lagi Maha Berdiri sendiri',
      source_reference: 'H.R. An Nasai',
      repeat_count: '1',
      sort_order: '4',
      is_active: 'TRUE'
    }
  ],
  [SHEET_NAMES.QURAN_SURAHS]: [
    {
      surah_id: 'surah_001',
      surah_number: '1',
      surah_name_arabic: 'الفاتحة',
      surah_name_latin: 'Al Fatihah',
      surah_name_indonesia: 'Pembukaan',
      total_verses: '7',
      revelation_type: 'makkiyah',
      is_active: 'TRUE'
    },
    {
      surah_id: 'surah_112',
      surah_number: '112',
      surah_name_arabic: 'الإخلاص',
      surah_name_latin: 'Al Ikhlas',
      surah_name_indonesia: 'Ikhlas',
      total_verses: '4',
      revelation_type: 'makkiyah',
      is_active: 'TRUE'
    }
  ],
  [SHEET_NAMES.QURAN_VERSES]: [
    {
      verse_id: 'v_001_001',
      surah_id: 'surah_001',
      verse_number: '1',
      arabic_text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      latin_text: 'Bismillahirrahmanirrahim',
      translation_text: 'Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang',
      audio_url: '',
      sort_order: '1',
      is_active: 'TRUE'
    },
    {
      verse_id: 'v_001_002',
      surah_id: 'surah_001',
      verse_number: '2',
      arabic_text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      latin_text: 'Alhamdu lillahi rabbil alamin',
      translation_text: 'Segala puji bagi Allah Tuhan seluruh alam',
      audio_url: '',
      sort_order: '2',
      is_active: 'TRUE'
    },
    {
      verse_id: 'v_112_001',
      surah_id: 'surah_112',
      verse_number: '1',
      arabic_text: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
      latin_text: 'Qul huwallahu ahad',
      translation_text: 'Katakanlah Allah Maha Esa',
      audio_url: '',
      sort_order: '1',
      is_active: 'TRUE'
    }
  ]
};

export function getSeedRowsBySheetName(sheetName) {
  const rows = SEED_DATA[sheetName] || [];
  return rows.map((item) => ({ ...item }));
}
