// backend/services/equipmentsService.js
const pool = require('../config/db');

// 🔹 Müsait ekipmanları getir (kiralanmamış olanlar)
exports.getAvailableEquipment = async () => {
  try {
    // Önce equipments tablosunun varlığını kontrol et
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'equipments'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.warn('⚠️ equipments tablosu bulunamadı, boş liste döndürülüyor');
      return [];
    }

    // equipment_rentals tablosu var mı kontrol et
    const rentalsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'equipment_rentals'
      );
    `);

    // equipment_types tablosu var mı kontrol et
    const typesTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'equipment_types'
      );
    `);

    const hasTypesTable = typesTableCheck.rows[0].exists;
    const hasRentalsTable = rentalsTableCheck.rows[0].exists;

    let query;
    if (hasRentalsTable) {
      // Her iki tablo da varsa, kiralama kontrolü yap
      if (hasTypesTable) {
        // equipment_types tablosu varsa JOIN yap
        query = `
          SELECT
            e.equipment_id,
            e.type_id,
            e.model,
            e.brand,
            e.price_per_hour,
            e.status,
            et.name AS type_name
          FROM equipments e
          LEFT JOIN equipment_types et ON e.type_id = et.type_id
          WHERE (e.status = 'available' OR e.status IS NULL)
            AND e.equipment_id NOT IN (
              SELECT equipment_id
              FROM equipment_rentals
              WHERE status = 'ongoing'
            );
        `;
      } else {
        query = `
          SELECT
            e.equipment_id,
            e.type_id,
            e.model,
            e.brand,
            e.price_per_hour,
            e.status
          FROM equipments e
          WHERE (e.status = 'available' OR e.status IS NULL)
            AND e.equipment_id NOT IN (
              SELECT equipment_id
              FROM equipment_rentals
              WHERE status = 'ongoing'
            );
        `;
      }
    } else {
      // Sadece equipments tablosu varsa, status kontrolü yap
      if (hasTypesTable) {
        // equipment_types tablosu varsa JOIN yap
        query = `
          SELECT
            e.equipment_id,
            e.type_id,
            e.model,
            e.brand,
            e.price_per_hour,
            e.status,
            et.name AS type_name
          FROM equipments e
          LEFT JOIN equipment_types et ON e.type_id = et.type_id
          WHERE e.status = 'available' OR e.status IS NULL;
        `;
      } else {
        query = `
          SELECT
            e.equipment_id,
            e.type_id,
            e.model,
            e.brand,
            e.price_per_hour,
            e.status
          FROM equipments e
          WHERE e.status = 'available' OR e.status IS NULL;
        `;
      }
    }

    const { rows } = await pool.query(query);

    // Debug: İlk satırı logla
    if (rows.length > 0) {
      console.log('🔍 İlk ekipman örneği:', {
        equipment_id: rows[0].equipment_id,
        type_id: rows[0].type_id,
        type_name: rows[0].type_name,
        brand: rows[0].brand,
        model: rows[0].model
      });
    }

    return rows.map(row => ({
      equipment_id: row.equipment_id,
      type_id: row.type_id,
      type_name: row.type_name || null,
      brand: row.brand,
      model: row.model,
      price_per_hour: row.price_per_hour,
      status: row.status
    }));
  } catch (err) {
    console.error('❌ getAvailableEquipment hatası:', err.message);
    // Hata durumunda boş liste döndür, sunucu çökmesin
    return [];
  }
};

// 🔹 Admin: Yeni ekipman oluştur
exports.createEquipment = async ({ brand, model, type_id, price_per_hour }) => {
  // Veri tiplerini garanti et
  const priceNum = parseFloat(price_per_hour);
  
  // type_id zorunlu (veritabanı şemasına göre)
  let typeIdNum;
  if (type_id) {
    typeIdNum = parseInt(type_id, 10);
    if (Number.isNaN(typeIdNum) || typeIdNum <= 0) {
      throw new Error('Tip ID geçerli bir pozitif sayı olmalıdır');
    }
  } else {
    // Eğer type_id verilmemişse, varsayılan olarak ilk mevcut type_id'yi al
    const typeCheck = await pool.query('SELECT type_id FROM equipment_types ORDER BY type_id LIMIT 1');
    if (typeCheck.rows.length > 0) {
      typeIdNum = typeCheck.rows[0].type_id;
      console.log(`⚠️  type_id verilmedi, varsayılan olarak ${typeIdNum} kullanılıyor`);
    } else {
      throw new Error('Tip ID zorunludur. Lütfen geçerli bir tip ID girin.');
    }
  }
  
  if (Number.isNaN(priceNum) || priceNum <= 0) {
    throw new Error('Saatlik fiyat geçerli bir pozitif sayı olmalıdır');
  }
  
  try {
    console.log('🔍 Ekipman oluşturma isteği:', { brand, model, type_id: typeIdNum, price_per_hour: priceNum });
    
    const query = `
      INSERT INTO equipments (brand, model, type_id, price_per_hour, status)
      VALUES ($1, $2, $3, $4, 'available')
      RETURNING equipment_id, brand, model, type_id, price_per_hour, status;
    `;
    
    const { rows } = await pool.query(query, [brand, model, typeIdNum, priceNum]);
    
    if (rows.length === 0) {
      throw new Error('Ekipman oluşturulamadı');
    }
    
    console.log('✅ Ekipman başarıyla oluşturuldu:', rows[0]);
    return rows[0];
  } catch (err) {
    console.error('❌ Ekipman oluşturma hatası:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint
    });
    // Veritabanı hatalarını daha anlaşılır hale getir
    if (err.code === '23505') { // Unique constraint violation
      throw new Error('Bu ekipman zaten mevcut');
    } else if (err.code === '23502') { // Not null violation
      throw new Error('Gerekli alanlar eksik');
    } else if (err.code === '42P01') { // Table doesn't exist
      throw new Error('Equipments tablosu bulunamadı. Veritabanı şemasını kontrol edin.');
    } else if (err.code === '42703') { // Column doesn't exist
      throw new Error('Equipments tablosunda gerekli kolonlar bulunamadı. Veritabanı şemasını kontrol edin.');
    } else if (err.code === '23503') { // Foreign key violation
      throw new Error('Geçersiz tip ID');
    }
    // Orijinal hata mesajını kullan
    throw new Error(err.message || 'Ekipman oluşturulurken bir hata oluştu');
  }
};

// 🔹 Equipment types listesini getir
exports.getEquipmentTypes = async () => {
  try {
    const query = `
      SELECT type_id, name
      FROM equipment_types
      ORDER BY type_id;
    `;
    const { rows } = await pool.query(query);
    return rows;
  } catch (err) {
    console.error('❌ getEquipmentTypes hatası:', err.message);
    return [];
  }
};

// 🔹 Admin: Ekipman güncelle
exports.updateEquipment = async ({ equipmentId, brand, model, type_id, price_per_hour }) => {
  const query = `
    UPDATE equipments
    SET brand = COALESCE($1, brand),
        model = COALESCE($2, model),
        type_id = COALESCE($3, type_id),
        price_per_hour = COALESCE($4, price_per_hour)
    WHERE equipment_id = $5
    RETURNING equipment_id, brand, model, type_id, price_per_hour, status;
  `;
  
  const { rows } = await pool.query(query, [brand, model, type_id, price_per_hour, equipmentId]);
  
  if (rows.length === 0) {
    throw new Error('Ekipman bulunamadı');
  }
  
  return rows[0];
};

// 🔹 Admin: Ekipman sil (soft delete - status='maintenance')
exports.deleteEquipment = async (equipmentId) => {
  const query = `
    UPDATE equipments
    SET status = 'maintenance'
    WHERE equipment_id = $1
    RETURNING equipment_id, brand, model, status;
  `;
  
  const { rows } = await pool.query(query, [equipmentId]);
  
  if (rows.length === 0) {
    throw new Error('Ekipman bulunamadı');
  }
  
  return rows[0];
};
