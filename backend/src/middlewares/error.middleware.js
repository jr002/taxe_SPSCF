const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err);

  const statusCode = err.statusCode || 500;
  // Sans `statusCode`, l'erreur vient d'une couche technique (Prisma, JWT,
  // bcrypt) : son message décrit l'implémentation et ne doit pas sortir.
  const message = statusCode === 500
    ? 'Erreur interne du serveur'
    : (err.message || 'Erreur interne du serveur');

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
