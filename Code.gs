/**
 * Entry point for Google Apps Script Web App.
 */
function doGet(e) {
  if (isApiGatewayRequest_(e)) {
    return handleApiGatewayRequest_(e);
  }

  var html = HtmlService.createHtmlOutputFromFile('index').getContent();
  html = html.replace('<!--STYLE_SLOT-->', HtmlService.createHtmlOutputFromFile('style').getContent());
  html = html.replace('<!--SCRIPT_SLOT-->', HtmlService.createHtmlOutputFromFile('script').getContent());

  return HtmlService.createHtmlOutput(html)
    .setTitle('Aplikasi Buku Iqro 1-6 Lengkap')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Optional POST gateway for API use.
 */
function doPost(e) {
  return handleApiGatewayRequest_(e);
}

function isApiGatewayRequest_(e) {
  return !!(e && e.parameter && e.parameter.action);
}
