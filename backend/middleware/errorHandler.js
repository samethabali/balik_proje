const errorHandler = (err, req, res, next) => {
  console.error('🔥 HATA:', err.stack);
  console.error('🔥 Hata Detayları:', {
    message: err.message,
    code: err.code,
    detail: err.detail,
    hint: err.hint
  });

  // Frontend'in beklediği format: { error: "..." }
  res.status(err.status || 500).json({
    error: err.message || 'Sunucu Hatası',
  });
};

module.exports = errorHandler;