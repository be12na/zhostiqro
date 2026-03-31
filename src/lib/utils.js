import { createJsonResponse } from './response.js';

export function validateRequiredParam(paramName, paramValue) {
  if (paramValue === null || paramValue === undefined || paramValue === '') {
    return createJsonResponse(false, `Parameter wajib: ${paramName}`, null);
  }
  return null;
}

export function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  return false;
}

export function filterActiveRows(rows) {
  return rows.filter((item) => toBoolean(item.is_active));
}

export function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function sortByNumberField(rows, fieldName, fallbackNumber = 9999) {
  return [...rows].sort((a, b) => toNumber(a[fieldName], fallbackNumber) - toNumber(b[fieldName], fallbackNumber));
}

export function findOneByField(rows, fieldName, fieldValue) {
  const target = String(fieldValue);
  return rows.find((item) => String(item[fieldName]) === target) || null;
}

export async function safeExecute(callback) {
  try {
    return await callback();
  } catch (error) {
    return createJsonResponse(false, `Terjadi kesalahan: ${error.message}`, null);
  }
}
