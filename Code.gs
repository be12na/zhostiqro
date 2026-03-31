/**
 * Entry point for Google Apps Script Web App.
 */
function doGet() {
  var html = HtmlService.createHtmlOutputFromFile('index').getContent();
  html = html.replace('<!--STYLE_SLOT-->', HtmlService.createHtmlOutputFromFile('style').getContent());
  html = html.replace('<!--SCRIPT_SLOT-->', HtmlService.createHtmlOutputFromFile('script').getContent());

  return HtmlService.createHtmlOutput(html)
    .setTitle('Aplikasi Buku Iqro 1-6 Lengkap')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
