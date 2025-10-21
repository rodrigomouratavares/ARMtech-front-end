require('dotenv').config();

console.log('=== TESTE DE VARIÁVEIS DE AMBIENTE ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
console.log('DATABASE_URL preview:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'undefined');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

// Teste de conexão com o banco
console.log('\n=== TESTE DE CONEXÃO COM BANCO ===');
const { Pool } = require('pg');

async function testDatabaseConnection() {
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });

        console.log('Tentando conectar ao banco...');
        const client = await pool.connect();
        console.log('✅ Conexão com banco bem-sucedida!');

        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('⏰ Hora do servidor:', result.rows[0].current_time);
        console.log('🗄️ Versão PostgreSQL:', result.rows[0].pg_version.split(' ')[0]);

        // Testar se a tabela users existe
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        console.log('👥 Tabela users existe:', tableCheck.rows[0].exists);

        if (tableCheck.rows[0].exists) {
            const userCount = await client.query('SELECT COUNT(*) as count FROM users');
            console.log('📊 Número de usuários:', userCount.rows[0].count);
        }

        client.release();
        await pool.end();

    } catch (error) {
        console.error('❌ Erro na conexão com banco:', error.message);
        console.error('Detalhes do erro:', error);
    }
}

testDatabaseConnection();