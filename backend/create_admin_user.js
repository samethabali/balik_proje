// Admin kullanıcısı oluşturma scripti
// Kullanım: backend klasöründen: node create_admin_user.js

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdminUser() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ HATA: DATABASE_URL .env dosyasında tanımlı değil!');
    process.exit(1);
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: connectionString?.includes('supabase.co')
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    await client.connect();
    console.log('✅ Veritabanına bağlanıldı.');

    // Admin kullanıcı bilgileri
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Admin Kullanıcı';
    const adminPhone = process.env.ADMIN_PHONE || null;

    // Kullanıcı zaten var mı kontrol et
    const checkUser = await client.query(
      'SELECT user_id, email, role_id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (checkUser.rows.length > 0) {
      const existingUser = checkUser.rows[0];
      console.log(`⚠️  Kullanıcı zaten mevcut: ${adminEmail}`);
      
      // Eğer admin değilse, admin yap
      if (existingUser.role_id !== 2) {
        await client.query(
          'UPDATE users SET role_id = 2 WHERE user_id = $1',
          [existingUser.user_id]
        );
        console.log(`✅ Kullanıcı admin yapıldı (user_id: ${existingUser.user_id})`);
      } else {
        console.log('ℹ️  Kullanıcı zaten admin.');
      }

      // Şifreyi güncelle
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE user_id = $2',
        [passwordHash, existingUser.user_id]
      );
      console.log('✅ Şifre güncellendi.');
      
      await client.end();
      return;
    }

    // Yeni admin kullanıcısı oluştur
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const roleId = 2; // Admin role_id

    const result = await client.query(
      `INSERT INTO users (role_id, full_name, email, phone, status, password_hash)
       VALUES ($1, $2, $3, $4, 'active', $5)
       RETURNING user_id, role_id, full_name, email, phone, created_at, status`,
      [roleId, adminName, adminEmail, adminPhone, passwordHash]
    );

    const newUser = result.rows[0];
    console.log('✅ Admin kullanıcısı başarıyla oluşturuldu!');
    console.log('📋 Kullanıcı Bilgileri:');
    console.log(`   - ID: ${newUser.user_id}`);
    console.log(`   - Ad Soyad: ${newUser.full_name}`);
    console.log(`   - E-posta: ${newUser.email}`);
    console.log(`   - Role ID: ${newUser.role_id} (Admin)`);
    console.log(`   - Durum: ${newUser.status}`);
    console.log('\n🔐 Giriş Bilgileri:');
    console.log(`   - E-posta: ${adminEmail}`);
    console.log(`   - Şifre: ${adminPassword}`);
    console.log('\n⚠️  GÜVENLİK UYARISI: Bu şifreyi güvenli bir yerde saklayın ve üretim ortamında değiştirin!');

    await client.end();
  } catch (err) {
    console.error('❌ Hata:', err.message);
    console.error(err.stack);
    await client.end();
    process.exit(1);
  }
}

// Scripti çalıştır
createAdminUser();

