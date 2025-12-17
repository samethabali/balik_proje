// backend/middleware/optionalAuthMiddleware.js
const jwt = require('jsonwebtoken');

// .env dosyasındaki gizli anahtarın adını kontrol et (JWT_SECRET veya SECRET_KEY olabilir)
const JWT_SECRET = process.env.JWT_SECRET || 'gizli-anahtariniz'; 

const optionalAuthMiddleware = (req, res, next) => {
  // Header'dan token'ı al
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" formatı

  if (!token) {
    // Token yoksa hata verme, sadece req.user'ı boş bırak ve devam et
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Token geçersizse veya süresi dolmuşsa yine hata verme, misafir gibi davran
      req.user = null; 
    } else {
      // Token geçerliyse kullanıcı bilgisini kaydet (Controller bunu kullanacak!)
      req.user = user; 
    }
    next();
  });
};

module.exports = optionalAuthMiddleware;