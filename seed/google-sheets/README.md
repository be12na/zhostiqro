# Google Sheets Seed Files

Folder ini berisi file CSV siap import ke Google Sheets sebagai database ringan.

## Daftar file

1. `app_config.csv` -> sheet `app_config`
2. `categories.csv` -> sheet `categories`
3. `materials.csv` -> sheet `materials`
4. `daily_prayers.csv` -> sheet `daily_prayers`
5. `dzikir.csv` -> sheet `dzikir`
6. `quran_surahs.csv` -> sheet `quran_surahs`
7. `quran_verses.csv` -> sheet `quran_verses`

## Urutan import yang disarankan

1. `app_config.csv`
2. `categories.csv`
3. `materials.csv`
4. `daily_prayers.csv`
5. `dzikir.csv`
6. `quran_surahs.csv`
7. `quran_verses.csv`

Urutan ini menjaga referensi seperti `category_id` dan `surah_id` tetap sinkron.

## Cara import cepat

1. Buka Google Sheets.
2. Buat sheet dengan nama sesuai target.
3. Klik sheet target -> `File` -> `Import` -> `Upload` -> pilih CSV.
4. Pilih mode `Replace current sheet`.
5. Ulangi untuk semua file.

## Catatan data

- Kolom dan urutan field sudah konsisten dengan backend Apps Script.
- `is_active` menggunakan `TRUE` supaya mudah difilter.
- `apps_script_web_app_url` sudah diisi pada `app_config.csv` sesuai URL Web App saat ini.
