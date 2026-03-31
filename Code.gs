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
      return handleApiGatewayRequest_(e);
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
