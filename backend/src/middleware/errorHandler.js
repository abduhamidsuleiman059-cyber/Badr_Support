class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  const message = error.publicMessage
    || (statusCode >= 500
      ? 'Internal server error'
      : error.type === 'entity.parse.failed'
        ? 'Invalid JSON request body'
        : error.message);

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({ error: { message } });
}

module.exports = { HttpError, errorHandler };
