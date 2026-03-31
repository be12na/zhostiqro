/**
 * Get application configuration from app_config sheet.
 */
function getAppConfig() {
  return safeExecute_(function() {
    var rows = getSheetDataAsObjects_(SHEET_NAMES.APP_CONFIG);
    var config = {};

    rows.forEach(function(item) {
      var key = String(item.config_key || '').trim();
      if (key) {
        config[key] = item.config_value;
      }
    });

    return jsonResponse_(true, 'Konfigurasi berhasil diambil.', config);
  });
}

/**
 * Get active categories sorted by sort_order.
 */
function getCategories() {
  return safeExecute_(function() {
    var rows = getSheetDataAsObjects_(SHEET_NAMES.CATEGORIES);
    var activeRows = filterActive_(rows);
    var sortedRows = sortByNumberField_(activeRows, 'sort_order', 9999);
    return jsonResponse_(true, 'Kategori berhasil diambil.', sortedRows);
  });
}

/**
 * Get active materials by category sorted by sort_order.
 */
function getMaterialsByCategory(categoryId) {
  return safeExecute_(function() {
    var validationError = validateRequiredParam_('categoryId', categoryId);
    if (validationError) return validationError;

    var rows = getSheetDataAsObjects_(SHEET_NAMES.MATERIALS);
    var activeRows = filterActive_(rows);
    var filteredRows = activeRows.filter(function(item) {
      return String(item.category_id) === String(categoryId);
    });
    var sortedRows = sortByNumberField_(filteredRows, 'sort_order', 9999);
    return jsonResponse_(true, 'Materi kategori berhasil diambil.', sortedRows);
  });
}

/**
 * Get one active material by material_id.
 */
function getMaterialById(materialId) {
  return safeExecute_(function() {
    var validationError = validateRequiredParam_('materialId', materialId);
    if (validationError) return validationError;

    var rows = getSheetDataAsObjects_(SHEET_NAMES.MATERIALS);
    var activeRows = filterActive_(rows);
    var material = findOneByField_(activeRows, 'material_id', materialId);

    if (!material) {
      return jsonResponse_(false, 'Materi tidak ditemukan.', null);
    }

    return jsonResponse_(true, 'Detail materi berhasil diambil.', material);
  });
}

/**
 * Get active daily prayers sorted by sort_order.
 */
function getDailyPrayers() {
  return safeExecute_(function() {
    var rows = getSheetDataAsObjects_(SHEET_NAMES.DAILY_PRAYERS);
    var activeRows = filterActive_(rows);
    var sortedRows = sortByNumberField_(activeRows, 'sort_order', 9999);
    return jsonResponse_(true, 'Doa harian berhasil diambil.', sortedRows);
  });
}

/**
 * Get active dzikir by optional type filter.
 */
function getDzikirByType(type) {
  return safeExecute_(function() {
    var rows = getSheetDataAsObjects_(SHEET_NAMES.DZIKIR);
    var activeRows = filterActive_(rows);
    var normalizedType = String(type || '').trim().toLowerCase();

    var filteredRows = activeRows;
    if (normalizedType) {
      filteredRows = activeRows.filter(function(item) {
        return String(item.dzikir_type || '').trim().toLowerCase() === normalizedType;
      });
    }

    var sortedRows = sortByNumberField_(filteredRows, 'sort_order', 9999);
    return jsonResponse_(true, 'Data zikir berhasil diambil.', sortedRows);
  });
}

/**
 * Get active surahs.
 * Assumption: quran_surahs has no sort_order, so we sort by surah_number.
 */
function getQuranSurahs() {
  return safeExecute_(function() {
    var rows = getSheetDataAsObjects_(SHEET_NAMES.QURAN_SURAHS);
    var activeRows = filterActive_(rows);
    var sortedRows = sortByNumberField_(activeRows, 'surah_number', 9999);
    return jsonResponse_(true, 'Daftar surat berhasil diambil.', sortedRows);
  });
}

/**
 * Get active verses by surah sorted by sort_order.
 */
function getQuranVersesBySurah(surahId) {
  return safeExecute_(function() {
    var validationError = validateRequiredParam_('surahId', surahId);
    if (validationError) return validationError;

    var rows = getSheetDataAsObjects_(SHEET_NAMES.QURAN_VERSES);
    var activeRows = filterActive_(rows);
    var filteredRows = activeRows.filter(function(item) {
      return String(item.surah_id) === String(surahId);
    });
    var sortedRows = sortByNumberField_(filteredRows, 'sort_order', 9999);
    return jsonResponse_(true, 'Ayat surat berhasil diambil.', sortedRows);
  });
}

/**
 * API gateway response for Apps Script Web App URL.
 * Supports action query parameter and keeps JSON contract.
 */
function handleApiGatewayRequest_(e) {
  var params = extractApiParams_(e);
  var action = String(params.action || '').trim();

  if (!action) {
    return toJsonOutput_(jsonResponse_(false, 'Parameter wajib: action', null));
  }

  var routes = {
    getAppConfig: function() { return getAppConfig(); },
    getCategories: function() { return getCategories(); },
    getMaterialsByCategory: function() { return getMaterialsByCategory(params.categoryId); },
    getMaterialById: function() { return getMaterialById(params.materialId); },
    getDailyPrayers: function() { return getDailyPrayers(); },
    getDzikirByType: function() { return getDzikirByType(params.type); },
    getQuranSurahs: function() { return getQuranSurahs(); },
    getQuranVersesBySurah: function() { return getQuranVersesBySurah(params.surahId); }
  };

  var handler = routes[action];
  if (!handler) {
    return toJsonOutput_(jsonResponse_(false, 'Action API tidak ditemukan: ' + action, null));
  }

  var payload = handler();
  return toJsonOutput_(payload);
}

function extractApiParams_(e) {
  var params = {};

  if (e && e.parameter) {
    params = e.parameter;
  }

  if (e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      if (body && typeof body === 'object') {
        for (var key in body) {
          if (body.hasOwnProperty(key) && (params[key] === undefined || params[key] === '')) {
            params[key] = body[key];
          }
        }
      }
    } catch (_error) {
      // Ignore invalid JSON body and keep query params.
    }
  }

  return params;
}

function toJsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
