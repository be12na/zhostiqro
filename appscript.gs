/**
 * File alias khusus sesuai permintaan: appscript.gs
 * Menyimpan endpoint Web App Apps Script agar tidak hardcode di banyak tempat.
 */
var APPSCRIPT_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbys4jJPffF0zqCZDGp-mXSwkF25DGxBrPVC9p-zeWKocK8wdA5vys-lTxUa5G3cCxOuRw/exec',
  SPREADSHEET_ID: '1WwrgXMq3KMb7FovwGHgjIzSMden1hgqT7bHf55WzTnQ'
};

function getAppScriptWebAppUrl() {
  return APPSCRIPT_CONFIG.WEB_APP_URL;
}

function getAppScriptConfig() {
  return {
    web_app_url: APPSCRIPT_CONFIG.WEB_APP_URL,
    spreadsheet_id: APPSCRIPT_CONFIG.SPREADSHEET_ID
  };
}

function getSpreadsheetId() {
  return APPSCRIPT_CONFIG.SPREADSHEET_ID;
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(APPSCRIPT_CONFIG.SPREADSHEET_ID);
}
