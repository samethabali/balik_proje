const requestLogger = (req, res, next) => {
  const method = req.method;
  const url = req.url;
  const time = new Date().toISOString();
  
  console.log(`[${time}] ${method} ${url}`);
  next(); // Bir sonraki aşamaya geç (Yoksa sayfa sonsuza kadar yüklenir)
};

module.exports = requestLogger;