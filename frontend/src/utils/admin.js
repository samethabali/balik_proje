// frontend/src/utils/admin.js
// Admin kontrolü için utility fonksiyonları

/**
 * Kullanıcının admin olup olmadığını kontrol eder
 * @param {Object} currentUser - Mevcut kullanıcı objesi (role_id içermeli)
 * @returns {boolean} - Admin ise true, değilse false
 */
export const isAdmin = (currentUser) => {
  if (!currentUser || !currentUser.role_id) {
    return false;
  }
  return currentUser.role_id === 2;
};

