import { createApiHandlers } from './lib/api.js';
import { createJsonResponse, errorJsonResponse, toJsonResponse } from './lib/response.js';

const ROUTE_TO_HANDLER = {
  '/api/getAppConfig': { fn: 'getAppConfig', params: [] },
  '/api/getCategories': { fn: 'getCategories', params: [] },
  '/api/getMaterialsByCategory': { fn: 'getMaterialsByCategory', params: ['categoryId'] },
  '/api/getMaterialById': { fn: 'getMaterialById', params: ['materialId'] },
  '/api/searchMaterials': { fn: 'searchMaterials', params: ['searchTitle', 'categoryId'] },
  '/api/getLearningProgress': { fn: 'getLearningProgress', params: ['username'] },
  '/api/saveLearningProgress': {
    fn: 'saveLearningProgress',
    params: ['username', 'materialId', 'materialTitle', 'categoryId', 'categoryName']
  },
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

  const paramValues = route.params.map((name) => url.searchParams.get(name) || '');
  const paramObject = {};
  route.params.forEach((name, index) => {
    paramObject[name] = paramValues[index] || '';
  });

  if (env.APPS_SCRIPT_WEB_APP_URL) {
    const requireAppsScriptProxy = isTruthy(env.REQUIRE_APPS_SCRIPT_PROXY);
    const proxyPayload = await proxyToAppsScript(route.fn, paramObject, env);
    if (proxyPayload && proxyPayload.success === true) {
      return toJsonResponse(proxyPayload, 200);
    }

    if (requireAppsScriptProxy) {
      return toJsonResponse(
        proxyPayload || createJsonResponse(false, 'Gagal sinkron ke Apps Script.', null),
        502
      );
    }
  }

  const handlers = createApiHandlers(env, ctx);
  const handler = handlers[route.fn];

  if (typeof handler !== 'function') {
    return errorJsonResponse('Handler API tidak tersedia.', 500);
  }

  const payload = await handler(...paramValues);

  return toJsonResponse(payload, 200);
}

function isTruthy(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value !== 'string') return false;

  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
}

async function proxyToAppsScript(action, params, env) {
  try {
    const upstreamUrl = new URL(env.APPS_SCRIPT_WEB_APP_URL);
    upstreamUrl.searchParams.set('action', action);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        upstreamUrl.searchParams.set(key, String(value));
      }
    });

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    const rawText = await upstreamResponse.text();
    let payload;

    try {
      payload = JSON.parse(rawText);
    } catch (_error) {
      return createJsonResponse(
        false,
        'Apps Script belum mengembalikan JSON API. Update doGet/doPost agar mendukung parameter action.',
        {
          upstream_status: upstreamResponse.status
        }
      );
    }

    if (!payload || typeof payload !== 'object' || !Object.prototype.hasOwnProperty.call(payload, 'success')) {
      return createJsonResponse(false, 'Response Apps Script tidak sesuai kontrak API.', null);
    }

    return payload;
  } catch (error) {
    return createJsonResponse(false, `Gagal menghubungi Apps Script: ${error.message}`, null);
  }
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
