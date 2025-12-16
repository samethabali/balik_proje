// Veritabanı şemasını kontrol etme scripti
// Kullanım: backend klasöründen: node check_schema.js

const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
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
    console.log('✅ Veritabanına bağlanıldı.\n');

    // Boats tablosu kontrolü
    console.log('📋 BOATS Tablosu Kontrolü:');
    try {
      const boatsColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'boats'
        ORDER BY ordinal_position;
      `);
      
      if (boatsColumns.rows.length === 0) {
        console.log('❌ Boats tablosu bulunamadı!');
      } else {
        console.log('✅ Boats tablosu mevcut. Kolonlar:');
        boatsColumns.rows.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
      }
    } catch (err) {
      console.log('❌ Boats tablosu kontrolü başarısız:', err.message);
    }

    console.log('\n📋 EQUIPMENTS Tablosu Kontrolü:');
    try {
      const equipColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'equipments'
        ORDER BY ordinal_position;
      `);
      
      if (equipColumns.rows.length === 0) {
        console.log('❌ Equipments tablosu bulunamadı!');
      } else {
        console.log('✅ Equipments tablosu mevcut. Kolonlar:');
        equipColumns.rows.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
        });
      }
    } catch (err) {
      console.log('❌ Equipments tablosu kontrolü başarısız:', err.message);
    }

    await client.end();
  } catch (err) {
    console.error('❌ Hata:', err.message);
    await client.end();
    process.exit(1);
  }
}

checkSchema();

