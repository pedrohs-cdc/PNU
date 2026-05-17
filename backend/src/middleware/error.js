// Middleware centralizado de erro — Express 4/5.
// Distingue erros operacionais (4xx) de erros de sistema (5xx).
// Stack trace só aparece em NODE_ENV=development.

/**
 * @param {Error & { status?: number; statusCode?: number }} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV === 'development';
  const status = err.status ?? err.statusCode ?? 500;

  if (status >= 500) {
    console.error(
      `[${new Date().toISOString()}] ERROR ${req.method} ${req.path} —`,
      err.message,
      isDev ? err.stack : ''
    );
  }

  res.status(status).json({
    erro: err.message || 'Erro interno.',
    ...(isDev && status >= 500 && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
