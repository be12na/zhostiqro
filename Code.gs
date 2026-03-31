/**
 * Entry point for Google Apps Script Web App.
 */
function doGet(e) {
  return dispatchWebRequest_(e, 'GET');
}

/**
 * POST gateway for API use.
 */
function doPost(e) {
  return dispatchWebRequest_(e, 'POST');
}

function dispatchWebRequest_(e, method) {
  var action = extractActionFromRequest_(e);

  if (isApiGatewayRequest_(e, method, action)) {
    try {
      return executeApiGatewayRequest_(e);
    } catch (error) {
      return toJsonOutputSafe_(false, String(error && error.message ? error.message : error), null);
    }
  }

  return renderPublicApp_();
}

function isApiGatewayRequest_(e, method, action) {
  if (action) return true;
  if (method === 'POST') return true;

  var parameter = (e && e.parameter) || {};
  if (parameter.api === '1' || parameter.format === 'json') return true;

  return false;
}

function extractActionFromRequest_(e) {
  var parameter = (e && e.parameter) || {};
  if (parameter.action) return String(parameter.action);

  var parameters = (e && e.parameters) || {};
  if (parameters.action && parameters.action.length) {
    return String(parameters.action[0]);
  }

  var postData = e && e.postData;
  if (!postData || !postData.contents) return '';

  var rawBody = String(postData.contents || '').trim();
  if (!rawBody) return '';

  if (postData.type && postData.type.indexOf('application/json') !== -1) {
    try {
      var jsonBody = JSON.parse(rawBody);
      if (jsonBody && jsonBody.action) return String(jsonBody.action);
    } catch (_error) {
      return '';
    }
  }

  var formBody = parseFormEncodedBody_(rawBody);
  return formBody.action ? String(formBody.action) : '';
}

function executeApiGatewayRequest_(e) {
  if (typeof handleApiGatewayRequest_ === 'function') {
    return handleApiGatewayRequest_(e);
  }

  return handleApiGatewayRequestCompat_(e);
}

function handleApiGatewayRequestCompat_(e) {
  var params = extractApiParamsCompat_(e);
  var action = String(params.action || extractActionFromRequest_(e) || '').trim();

  if (!action) {
    return toJsonOutputSafe_(false, 'Parameter action wajib diisi.', null);
  }

  var payload = invokeApiActionCompat_(action, params);
  return toJsonOutputFromPayloadCompat_(payload);
}

function extractApiParamsCompat_(e) {
  var params = {};
  var parameter = (e && e.parameter) || {};
  var key;

  for (key in parameter) {
    if (Object.prototype.hasOwnProperty.call(parameter, key)) {
      params[key] = parameter[key];
    }
  }

  var postData = e && e.postData;
  if (!postData || !postData.contents) return params;

  var rawBody = String(postData.contents || '').trim();
  if (!rawBody) return params;

  if (postData.type && postData.type.indexOf('application/json') !== -1) {
    try {
      var jsonBody = JSON.parse(rawBody);
      if (jsonBody && typeof jsonBody === 'object') {
        for (key in jsonBody) {
          if (Object.prototype.hasOwnProperty.call(jsonBody, key) && params[key] === undefined) {
            params[key] = jsonBody[key];
          }
        }
      }
    } catch (_error) {
      return params;
    }
  } else {
    var formBody = parseFormEncodedBody_(rawBody);
    for (key in formBody) {
      if (Object.prototype.hasOwnProperty.call(formBody, key) && params[key] === undefined) {
        params[key] = formBody[key];
      }
    }
  }

  return params;
}

function invokeApiActionCompat_(action, params) {
  var actionMap = {
    getAppConfig: { fn: 'getAppConfig', params: [] },
    getCategories: { fn: 'getCategories', params: [] },
    getMaterialsByCategory: { fn: 'getMaterialsByCategory', params: ['categoryId'] },
    getMaterialById: { fn: 'getMaterialById', params: ['materialId'] },
    searchMaterials: { fn: 'searchMaterials', params: ['searchTitle', 'categoryId'] },
    getLearningProgress: { fn: 'getLearningProgress', params: ['username'] },
    saveLearningProgress: {
      fn: 'saveLearningProgress',
      params: ['username', 'materialId', 'materialTitle', 'categoryId', 'categoryName']
    },
    getDailyPrayers: { fn: 'getDailyPrayers', params: [] },
    getDzikirByType: { fn: 'getDzikirByType', params: ['type'] },
    getQuranSurahs: { fn: 'getQuranSurahs', params: [] },
    getQuranVersesBySurah: { fn: 'getQuranVersesBySurah', params: ['surahId'] }
  };

  var route = actionMap[action];
  if (!route) {
    return {
      success: false,
      message: 'Action "' + action + '" tidak dikenali.',
      data: null
    };
  }

  var scope = typeof globalThis !== 'undefined' ? globalThis : this;
  var fn = scope && scope[route.fn];
  if (typeof fn !== 'function') {
    return {
      success: false,
      message:
        'Fungsi untuk action "' + action + '" belum tersedia di deployment. Pastikan Api.gs ikut dipublish.',
      data: null
    };
  }

  var args = [];
  for (var i = 0; i < route.params.length; i++) {
    var paramName = route.params[i];
    args.push(params[paramName] === undefined || params[paramName] === null ? '' : params[paramName]);
  }

  try {
    return fn.apply(null, args);
  } catch (error) {
    return {
      success: false,
      message: String(error && error.message ? error.message : error),
      data: null
    };
  }
}

function toJsonOutputFromPayloadCompat_(payload) {
  if (payload && typeof payload === 'object' && typeof payload.getContent === 'function') {
    return payload;
  }

  if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'success')) {
    return toJsonOutputSafe_(payload.success, payload.message, payload.data === undefined ? null : payload.data);
  }

  return toJsonOutputSafe_(true, 'OK', payload === undefined ? null : payload);
}

function parseFormEncodedBody_(rawBody) {
  var result = {};
  if (!rawBody) return result;

  var pairs = rawBody.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    if (!pair) continue;

    var separatorIndex = pair.indexOf('=');
    var rawKey = separatorIndex === -1 ? pair : pair.slice(0, separatorIndex);
    var rawValue = separatorIndex === -1 ? '' : pair.slice(separatorIndex + 1);
    var key = decodeURIComponent(String(rawKey).replace(/\+/g, ' '));
    var value = decodeURIComponent(String(rawValue).replace(/\+/g, ' '));

    result[key] = value;
  }

  return result;
}

function renderPublicApp_() {
  var html = HtmlService.createHtmlOutputFromFile('index').getContent();
  html = html.replace('<!--STYLE_SLOT-->', HtmlService.createHtmlOutputFromFile('style').getContent());
  html = html.replace('<!--SCRIPT_SLOT-->', HtmlService.createHtmlOutputFromFile('script').getContent());

  return HtmlService.createHtmlOutput(html)
    .setTitle('Aplikasi Buku Iqro 1-6 Lengkap')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function toJsonOutputSafe_(success, message, data) {
  var payload = { success: !!success, message: String(message || ''), data: data || null };

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
