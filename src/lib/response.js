export function createJsonResponse(success, message, data) {
  return {
    success: Boolean(success),
    message: message || '',
    data: data === undefined ? null : data
  };
}

export function toJsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export function errorJsonResponse(message, status = 400) {
  return toJsonResponse(createJsonResponse(false, message, null), status);
}
