# Cloudflare Workers Deployment Guide

## 1) Project Layout

```txt
src/
  worker.js            # Worker entry point + routing
  lib/
    api.js             # Business handlers (API contract tetap)
    sheets.js          # Google Sheets adapter via HTTP API
    utils.js           # Filter/sort/validation helpers
    response.js        # JSON response helpers
    constants.js       # Sheet names
public/
  index.html
  style.css
  app.js
wrangler.toml
package.json
```

## 2) Environment & Secrets

### Local development

Copy `.dev.vars.example` menjadi `.dev.vars`, lalu isi nilainya.

```bash
cp .dev.vars.example .dev.vars
```

### Cloudflare production

Set variable biasa di dashboard/wrangler:

- `SPREADSHEET_ID`
- `APP_NAME` (opsional)
- `SHEETS_CACHE_TTL` (opsional, default 300)

Set secret untuk API key:

```bash
wrangler secret put GOOGLE_SHEETS_API_KEY
```

## 3) Commands

```bash
npm install
npm run dev
npm run check
npm run deploy
```

## 4) API Endpoints (Contract dipertahankan)

- `GET /api/getAppConfig`
- `GET /api/getCategories`
- `GET /api/getMaterialsByCategory?categoryId=...`
- `GET /api/getMaterialById?materialId=...`
- `GET /api/getDailyPrayers`
- `GET /api/getDzikirByType?type=pagi|petang`
- `GET /api/getQuranSurahs`
- `GET /api/getQuranVersesBySurah?surahId=...`

Response format tetap:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

## 5) Compatibility Notes

- Menggunakan Web APIs native Workers (`fetch`, `Request`, `Response`, `URL`, `caches.default`).
- Tidak memakai API Node.js yang tidak kompatibel.
- Data tetap dari Google Sheets (schema tidak diubah).
