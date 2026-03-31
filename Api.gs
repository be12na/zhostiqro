/**
 * Get application configuration from app_config sheet.
 */
var LEARNING_PROGRESS_HEADERS = [
  'username',
  'material_id',
  'material_title',
  'category_id',
  'category_name',
  'completed_at',
  'updated_at'
];

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
 * Search active materials by title (and optional category).
 */
function searchMaterials(searchTitle, categoryId) {
  return safeExecute_(function() {
    var rows = getSheetDataAsObjects_(SHEET_NAMES.MATERIALS);
    var activeRows = filterActive_(rows);

    var normalizedTitle = String(searchTitle || '').trim().toLowerCase();
    var normalizedCategoryId = String(categoryId || '').trim();

    var categoryLookup = {};
    try {
      var categoryRows = filterActive_(getSheetDataAsObjects_(SHEET_NAMES.CATEGORIES));
      categoryRows.forEach(function(category) {
        var id = String(category.category_id || '').trim();
        if (id) {
          categoryLookup[id] = String(category.category_name || '').trim();
        }
      });
    } catch (_error) {
      // Keep searching materials even if categories sheet is unavailable.
    }

    var filteredRows = activeRows.filter(function(item) {
      var itemCategoryId = String(item.category_id || '').trim();
      var titleText = String(item.title || '').toLowerCase();
      var subtitleText = String(item.subtitle || '').toLowerCase();

      var categoryMatch = !normalizedCategoryId || itemCategoryId === normalizedCategoryId;
      var titleMatch = !normalizedTitle || titleText.indexOf(normalizedTitle) !== -1 || subtitleText.indexOf(normalizedTitle) !== -1;

      return categoryMatch && titleMatch;
    });

    var sortedRows = sortByNumberField_(filteredRows, 'sort_order', 9999).map(function(item) {
      var normalizedItem = {};
      for (var key in item) {
        if (item.hasOwnProperty(key)) {
          normalizedItem[key] = item[key];
        }
      }

      var categoryKey = String(item.category_id || '').trim();
      if (!normalizedItem.category_name) {
        normalizedItem.category_name = categoryLookup[categoryKey] || '';
      }

      return normalizedItem;
    });

    return jsonResponse_(true, 'Pencarian materi berhasil.', sortedRows);
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
 * Get completed materials by username.
 */
function getLearningProgress(username) {
  return safeExecute_(function() {
    var normalizedUsername = normalizeUsername_(username);
    var validationError = validateRequiredParam_('username', normalizedUsername);
    if (validationError) return validationError;

    var rows;
    try {
      rows = getSheetDataAsObjects_(SHEET_NAMES.LEARNING_PROGRESS);
    } catch (error) {
      if (String(error && error.message || '').indexOf('Sheet tidak ditemukan') !== -1) {
        return jsonResponse_(true, 'Belum ada progres belajar tersimpan.', {
          username: normalizedUsername,
          completed_material_ids: [],
          items: []
        });
      }
      throw error;
    }

    var usernameLower = normalizedUsername.toLowerCase();
    var progressRows = rows.filter(function(item) {
      return String(item.username || '').trim().toLowerCase() === usernameLower;
    });

    var seen = {};
    var items = [];
    progressRows.forEach(function(item) {
      var materialId = String(item.material_id || '').trim();
      if (!materialId || seen[materialId]) {
        return;
      }
      seen[materialId] = true;
      items.push(item);
    });

    return jsonResponse_(true, 'Progres belajar berhasil diambil.', {
      username: normalizedUsername,
      completed_material_ids: Object.keys(seen),
      items: items
    });
  });
}

/**
 * Save one completed material for username (upsert by username + material_id).
 */
function saveLearningProgress(username, materialId, materialTitle, categoryId, categoryName) {
  return safeExecute_(function() {
    var normalizedUsername = normalizeUsername_(username);
    var normalizedMaterialId = String(materialId || '').trim();

    var usernameValidation = validateRequiredParam_('username', normalizedUsername);
    if (usernameValidation) return usernameValidation;

    var materialValidation = validateRequiredParam_('materialId', normalizedMaterialId);
    if (materialValidation) return materialValidation;

    var sheet = getOrCreateSheet_(SHEET_NAMES.LEARNING_PROGRESS, LEARNING_PROGRESS_HEADERS);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(value) {
      return String(value || '').trim();
    });
    var headerMap = getHeaderIndexMap_(headers);

    var requiredColumns = [
      'username',
      'material_id',
      'material_title',
      'category_id',
      'category_name',
      'completed_at',
      'updated_at'
    ];

    requiredColumns.forEach(function(columnName) {
      if (headerMap[columnName] === undefined) {
        throw new Error('Kolom wajib tidak ditemukan di sheet learning_progress: ' + columnName);
      }
    });

    var values = sheet.getDataRange().getValues();
    var nowIso = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', "yyyy-MM-dd'T'HH:mm:ss");

    var rowToUpdate = -1;
    for (var i = 1; i < values.length; i += 1) {
      var rowUsername = String(values[i][headerMap.username] || '').trim().toLowerCase();
      var rowMaterialId = String(values[i][headerMap.material_id] || '').trim();
      if (rowUsername === normalizedUsername.toLowerCase() && rowMaterialId === normalizedMaterialId) {
        rowToUpdate = i + 1;
        break;
      }
    }

    var normalizedMaterialTitle = String(materialTitle || '').trim();
    var normalizedCategoryId = String(categoryId || '').trim();
    var normalizedCategoryName = String(categoryName || '').trim();

    if (rowToUpdate > 0) {
      sheet.getRange(rowToUpdate, headerMap.material_title + 1).setValue(normalizedMaterialTitle);
      sheet.getRange(rowToUpdate, headerMap.category_id + 1).setValue(normalizedCategoryId);
      sheet.getRange(rowToUpdate, headerMap.category_name + 1).setValue(normalizedCategoryName);

      var existingCompletedAt = String(sheet.getRange(rowToUpdate, headerMap.completed_at + 1).getValue() || '').trim();
      if (!existingCompletedAt) {
        sheet.getRange(rowToUpdate, headerMap.completed_at + 1).setValue(nowIso);
      }
      sheet.getRange(rowToUpdate, headerMap.updated_at + 1).setValue(nowIso);
    } else {
      var newRow = headers.map(function(columnName) {
        if (columnName === 'username') return normalizedUsername;
        if (columnName === 'material_id') return normalizedMaterialId;
        if (columnName === 'material_title') return normalizedMaterialTitle;
        if (columnName === 'category_id') return normalizedCategoryId;
        if (columnName === 'category_name') return normalizedCategoryName;
        if (columnName === 'completed_at') return nowIso;
        if (columnName === 'updated_at') return nowIso;
        return '';
      });

      sheet.appendRow(newRow);
    }

    return jsonResponse_(true, 'Progres belajar berhasil disimpan.', {
      username: normalizedUsername,
      material_id: normalizedMaterialId
    });
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
    searchMaterials: function() { return searchMaterials(params.searchTitle, params.categoryId); },
    getLearningProgress: function() { return getLearningProgress(params.username); },
    saveLearningProgress: function() {
      return saveLearningProgress(
        params.username,
        params.materialId,
        params.materialTitle,
        params.categoryId,
        params.categoryName
      );
    },
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

function normalizeUsername_(username) {
  return String(username || '').trim();
}
