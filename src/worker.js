import { createApiHandlers } from './lib/api.js';
import { createJsonResponse, errorJsonResponse, toJsonResponse } from './lib/response.js';

const ROUTE_TO_HANDLER = {
  '/api/getAppConfig': { fn: 'getAppConfig', params: [] },
  '/api/getCategories': { fn: 'getCategories', params: [] },
  '/api/getMaterialsByCategory': { fn: 'getMaterialsByCategory', params: ['categoryId'] },
  '/api/getMaterialById': { fn: 'getMaterialById', params: ['materialId'] },
  '/api/getDailyPrayers': { fn: 'getDailyPrayers', params: [] },
  '/api/getDzikirByType': { fn: 'getDzikirByType', params: ['type'] },
  '/api/getQuranSurahs': { fn: 'getQuranSurahs', params: [] },
  '/api/getQuranVersesBySurah': { fn: 'getQuranVersesBySurah', params: ['surahId'] }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return toJsonResponse(createJsonResponse(true, 'Worker sehat.', { app: env.APP_NAME || 'Iqro App' }));
    }

    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, ctx, url);
    }

    return serveStaticAsset(request, env);
  }
};

async function handleApiRequest(request, env, ctx, url) {
  if (request.method !== 'GET') {
    return errorJsonResponse('Method tidak diizinkan. Gunakan GET.', 405);
  }

  const route = ROUTE_TO_HANDLER[url.pathname];
  if (!route) {
    return errorJsonResponse('Endpoint tidak ditemukan.', 404);
  }

  const handlers = createApiHandlers(env, ctx);
  const handler = handlers[route.fn];

  if (typeof handler !== 'function') {
    return errorJsonResponse('Handler API tidak tersedia.', 500);
  }

  const params = route.params.map((name) => url.searchParams.get(name) || '');
  const payload = await handler(...params);

  const status = payload.success ? 200 : 400;
  return toJsonResponse(payload, status);
}

async function serveStaticAsset(request, env) {
  if (!env.ASSETS || typeof env.ASSETS.fetch !== 'function') {
    return new Response('ASSETS binding belum dikonfigurasi.', { status: 500 });
  }

  const assetResponse = await env.ASSETS.fetch(request);
  if (assetResponse.status !== 404) {
    return assetResponse;
  }

  const fallbackRequest = new Request(new URL('/index.html', request.url), request);
  return env.ASSETS.fetch(fallbackRequest);
}
