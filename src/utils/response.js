/**
 * Standard API response format per PRD.
 * { status: "success" | "error", message: string, data: {} }
 */

function success(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
}

function error(res, message = 'An error occurred', statusCode = 500, data = null) {
  const payload = {
    status: 'error',
    message,
    data: data || {},
  };
  return res.status(statusCode).json(payload);
}

module.exports = { success, error };
