import { SHEET_NAMES } from './constants.js';
import { createJsonResponse } from './response.js';
import {
  filterActiveRows,
  findOneByField,
  safeExecute,
  sortByNumberField,
  validateRequiredParam
} from './utils.js';
import { getSheetDataAsObjects } from './sheets.js';

export function createApiHandlers(env, ctx) {
  return {
    getAppConfig: () => getAppConfig(env, ctx),
    getCategories: () => getCategories(env, ctx),
    getMaterialsByCategory: (categoryId) => getMaterialsByCategory(env, ctx, categoryId),
    getMaterialById: (materialId) => getMaterialById(env, ctx, materialId),
    getDailyPrayers: () => getDailyPrayers(env, ctx),
    getDzikirByType: (type) => getDzikirByType(env, ctx, type),
    getQuranSurahs: () => getQuranSurahs(env, ctx),
    getQuranVersesBySurah: (surahId) => getQuranVersesBySurah(env, ctx, surahId)
  };
}

async function getAppConfig(env, ctx) {
  return safeExecute(async () => {
    const rows = await getSheetDataAsObjects(env, ctx, SHEET_NAMES.APP_CONFIG);
    const config = {};

    rows.forEach((item) => {
      const key = String(item.config_key || '').trim();
      if (key) {
        config[key] = item.config_value;
      }
    });

    return createJsonResponse(true, 'Konfigurasi berhasil diambil.', config);
  });
}

async function getCategories(env, ctx) {
  return safeExecute(async () => {
    const rows = await getSheetDataAsObjects(env, ctx, SHEET_NAMES.CATEGORIES);
    const activeRows = filterActiveRows(rows);
    const sortedRows = sortByNumberField(activeRows, 'sort_order', 9999);
    return createJsonResponse(true, 'Kategori berhasil diambil.', sortedRows);
  });
}

async function getMaterialsByCategory(env, ctx, categoryId) {
  return safeExecute(async () => {
    const validationError = validateRequiredParam('categoryId', categoryId);
    if (validationError) return validationError;

    const rows = await getSheetDataAsObjects(env, ctx, SHEET_NAMES.MATERIALS);
    const activeRows = filterActiveRows(rows);
    const filteredRows = activeRows.filter((item) => String(item.category_id) === String(categoryId));
    const sortedRows = sortByNumberField(filteredRows, 'sort_order', 9999);
    return createJsonResponse(true, 'Materi kategori berhasil diambil.', sortedRows);
  });
}

async function getMaterialById(env, ctx, materialId) {
  return safeExecute(async () => {
    const validationError = validateRequiredParam('materialId', materialId);
    if (validationError) return validationError;

    const rows = await getSheetDataAsObjects(env, ctx, SHEET_NAMES.MATERIALS);
    const activeRows = filterActiveRows(rows);
    const material = findOneByField(activeRows, 'material_id', materialId);

    if (!material) {
      return createJsonResponse(false, 'Materi tidak ditemukan.', null);
    }

    return createJsonResponse(true, 'Detail materi berhasil diambil.', material);
  });
}

async function getDailyPrayers(env, ctx) {
  return safeExecute(async () => {
    const rows = await getSheetDataAsObjects(env, ctx, SHEET_NAMES.DAILY_PRAYERS);
    const activeRows = filterActiveRows(rows);
    const sortedRows = sortByNumberField(activeRows, 'sort_order', 9999);
    return createJsonResponse(true, 'Doa harian berhasil diambil.', sortedRows);
  });
}

async function getDzikirByType(env, ctx, type) {
  return safeExecute(async () => {
    const rows = await getSheetDataAsObjects(env, ctx, SHEET_NAMES.DZIKIR);
    const activeRows = filterActiveRows(rows);
    const normalizedType = String(type || '').trim().toLowerCase();

    let filteredRows = activeRows;
    if (normalizedType) {
      filteredRows = activeRows.filter(
        (item) => String(item.dzikir_type || '').trim().toLowerCase() === normalizedType
      );
    }

    const sortedRows = sortByNumberField(filteredRows, 'sort_order', 9999);
    return createJsonResponse(true, 'Data zikir berhasil diambil.', sortedRows);
  });
}

async function getQuranSurahs(env, ctx) {
  return safeExecute(async () => {
    const rows = await getSheetDataAsObjects(env, ctx, SHEET_NAMES.QURAN_SURAHS);
    const activeRows = filterActiveRows(rows);
    const sortedRows = sortByNumberField(activeRows, 'surah_number', 9999);
    return createJsonResponse(true, 'Daftar surat berhasil diambil.', sortedRows);
  });
}

async function getQuranVersesBySurah(env, ctx, surahId) {
  return safeExecute(async () => {
    const validationError = validateRequiredParam('surahId', surahId);
    if (validationError) return validationError;

    const rows = await getSheetDataAsObjects(env, ctx, SHEET_NAMES.QURAN_VERSES);
    const activeRows = filterActiveRows(rows);
    const filteredRows = activeRows.filter((item) => String(item.surah_id) === String(surahId));
    const sortedRows = sortByNumberField(filteredRows, 'sort_order', 9999);
    return createJsonResponse(true, 'Ayat surat berhasil diambil.', sortedRows);
  });
}
