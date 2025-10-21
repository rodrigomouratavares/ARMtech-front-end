require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function checkUsers() {
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });

        const client = await pool.connect();

        // Buscar todos os usuários
        const result = await client.query(`
            SELECT id, email, name, role, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);

        console.log('=== USUÁRIOS NO BANCO ===');
        result.rows.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} - ${user.name} (${user.role})`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Criado em: ${user.created_at}`);
            console.log('');
        });

        // Testar senha do admin
        const adminUser = await client.query(`
            SELECT email, password 
            FROM users 
            WHERE email = 'admin@flowcrm.com'
        `);

        if (adminUser.rows.length > 0) {
            console.log('=== TESTE DE SENHA ADMIN ===');
            const storedPassword = adminUser.rows[0].password;
            console.log('Hash armazenado:', storedPassword.substring(0, 20) + '...');

            // Testar senha admin123
            const isValidPassword = await bcrypt.compare('admin123', storedPassword);
            console.log('Senha "admin123" é válida:', isValidPassword);

            if (!isValidPassword) {
                console.log('❌ Senha incorreta! Vamos atualizar...');

                // Gerar novo hash
                const newHash = await bcrypt.hash('admin123', 12);

                // Atualizar senha
                await client.query(`
                    UPDATE users 
                    SET password = $1, updated_at = NOW() 
                    WHERE email = 'admin@flowcrm.com'
                `, [newHash]);

                console.log('✅ Senha atualizada com sucesso!');
            }
        } else {
            console.log('❌ Usuário admin@flowcrm.com não encontrado!');

            // Criar usuário admin
            const newHash = await bcrypt.hash('admin123', 12);
            await client.query(`
                INSERT INTO users (id, email, password, name, role, permissions, created_at, updated_at)
                VALUES (gen_random_uuid(), 'admin@flowcrm.com', $1, 'System Administrator', 'admin', NULL, NOW(), NOW())
            `, [newHash]);

            console.log('✅ Usuário admin criado com sucesso!');
        }

        client.release();
        await pool.end();

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

checkUsers();