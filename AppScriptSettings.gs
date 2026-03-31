/**
 * Konfigurasi pusat untuk endpoint Web App Apps Script.
 * Bisa dipakai frontend/client eksternal agar URL tidak hardcoded di banyak tempat.
 */
var APP_SCRIPT_SETTINGS = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbys4jJPffF0zqCZDGp-mXSwkF25DGxBrPVC9p-zeWKocK8wdA5vys-lTxUa5G3cCxOuRw/exec',
  SPREADSHEET_ID: '1WwrgXMq3KMb7FovwGHgjIzSMden1hgqT7bHf55WzTnQ'
};

/**
 * Ambil URL Web App aktif.
 */
function getWebAppUrl() {
  return APP_SCRIPT_SETTINGS.WEB_APP_URL;
}

/**
 * Ambil setting publik sederhana.
 */
function getPublicAppSettings() {
  return {
    web_app_url: APP_SCRIPT_SETTINGS.WEB_APP_URL,
    spreadsheet_id: APP_SCRIPT_SETTINGS.SPREADSHEET_ID
  };
}
