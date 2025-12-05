// Try-catch bloklarını otomatik saran fonksiyon
const asyncWrapper = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error); // Hatayı errorHandler'a gönder
    }
  };
};

module.exports = asyncWrapper;