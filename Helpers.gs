/**
 * Map sheet names in one place.
 */
var SHEET_NAMES = {
  APP_CONFIG: 'app_config',
  CATEGORIES: 'categories',
  MATERIALS: 'materials',
  DAILY_PRAYERS: 'daily_prayers',
  DZIKIR: 'dzikir',
  QURAN_SURAHS: 'quran_surahs',
  QURAN_VERSES: 'quran_verses'
};

/**
 * Standard JSON response shape.
 */
function jsonResponse_(success, message, data) {
  return {
    success: Boolean(success),
    message: message || '',
    data: data === undefined ? null : data
  };
}

/**
 * Basic required parameter validator.
 */
function validateRequiredParam_(paramName, paramValue) {
  if (paramValue === null || paramValue === undefined || paramValue === '') {
    return jsonResponse_(false, 'Parameter wajib: ' + paramName, null);
  }
  return null;
}

/**
 * Execute callback with safe error handling.
 */
function safeExecute_(callback) {
  try {
    return callback();
  } catch (error) {
    return jsonResponse_(false, 'Terjadi kesalahan: ' + error.message, null);
  }
}

/**
 * Convert Google Sheet rows into object array.
 */
function getSheetDataAsObjects_(sheetName) {
  var spreadsheet = getSpreadsheetByConfig_();
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet tidak ditemukan: ' + sheetName);
  }

  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) {
    return [];
  }

  var headers = values[0].map(function(header) {
    return String(header).trim();
  });

  var rows = values.slice(1);
  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Open spreadsheet with fixed ID if available, otherwise fallback to active spreadsheet.
 */
function getSpreadsheetByConfig_() {
  if (typeof APPSCRIPT_CONFIG !== 'undefined' && APPSCRIPT_CONFIG.SPREADSHEET_ID) {
    return SpreadsheetApp.openById(APPSCRIPT_CONFIG.SPREADSHEET_ID);
  }

  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!activeSpreadsheet) {
    throw new Error('Spreadsheet aktif tidak ditemukan. Isi APPSCRIPT_CONFIG.SPREADSHEET_ID terlebih dahulu.');
  }

  return activeSpreadsheet;
}

/**
 * Normalize mixed boolean values from sheets.
 */
function toBoolean_(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    var normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
}

/**
 * Parse number with fallback.
 */
function toNumber_(value, fallback) {
  var parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Keep only active rows by is_active column.
 */
function filterActive_(rows) {
  return rows.filter(function(item) {
    return toBoolean_(item.is_active);
  });
}

/**
 * Sort rows by numeric field.
 */
function sortByNumberField_(rows, fieldName, fallback) {
  return rows.slice().sort(function(a, b) {
    return toNumber_(a[fieldName], fallback) - toNumber_(b[fieldName], fallback);
  });
}

/**
 * Find single row by field value.
 */
function findOneByField_(rows, fieldName, fieldValue) {
  var target = String(fieldValue);
  for (var i = 0; i < rows.length; i += 1) {
    if (String(rows[i][fieldName]) === target) {
      return rows[i];
    }
  }
  return null;
}
