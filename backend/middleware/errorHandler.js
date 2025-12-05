const errorHandler = (err, req, res, next) => {
  console.error('🔥 HATA:', err.stack);

  res.status(500).json({
    success: false,
    message: err.message || 'Sunucu Hatası',
  });
};

module.exports = errorHandler;