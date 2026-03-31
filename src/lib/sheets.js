/**
 * Read one sheet from Google Sheets API and map rows into object array.
 * Uses Workers Cache API to reduce repeated upstream calls.
 */
export async function getSheetDataAsObjects(env, ctx, sheetName) {
  const spreadsheetId = env.SPREADSHEET_ID;
  const apiKey = env.GOOGLE_SHEETS_API_KEY;

  if (!spreadsheetId) {
    throw new Error('Environment variable SPREADSHEET_ID belum diatur.');
  }

  if (!apiKey) {
    throw new Error('Secret GOOGLE_SHEETS_API_KEY belum diatur.');
  }

  const ttl = Number(env.SHEETS_CACHE_TTL || 300);
  const cacheKey = new Request(`https://internal-cache.local/sheets/${spreadsheetId}/${encodeURIComponent(sheetName)}`);

  const cached = await caches.default.match(cacheKey);
  if (cached) {
    return cached.json();
  }

  const range = encodeURIComponent(sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

  const response = await fetch(url, {
    cf: {
      cacheEverything: true,
      cacheTtl: ttl
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    const reason = payload?.error?.message || 'Gagal mengambil data Google Sheets.';
    throw new Error(reason);
  }

  const values = payload.values || [];
  if (values.length < 2) {
    const emptyRows = [];
    await cacheRows(ctx, cacheKey, emptyRows, ttl);
    return emptyRows;
  }

  const headers = values[0].map((header) => String(header).trim());
  const rows = values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  await cacheRows(ctx, cacheKey, rows, ttl);
  return rows;
}

async function cacheRows(ctx, cacheKey, rows, ttl) {
  const cacheResponse = new Response(JSON.stringify(rows), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${ttl}`
    }
  });

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(caches.default.put(cacheKey, cacheResponse));
    return;
  }

  await caches.default.put(cacheKey, cacheResponse);
}
