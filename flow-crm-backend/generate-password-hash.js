#!/usr/bin/env node

const bcrypt = require('bcryptjs');

// Função para gerar hash de senha
async function generatePasswordHash(password) {
    const saltRounds = 12;
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        return hash;
    } catch (error) {
        console.error('Erro ao gerar hash:', error);
        return null;
    }
}

// Função principal
async function main() {
    const password = process.argv[2];

    if (!password) {
        console.log('Uso: node generate-password-hash.js <senha>');
        console.log('Exemplo: node generate-password-hash.js minhasenha123');
        process.exit(1);
    }

    console.log(`Gerando hash para a senha: "${password}"`);
    const hash = await generatePasswordHash(password);

    if (hash) {
        console.log('\n✅ Hash gerado com sucesso:');
        console.log(hash);
        console.log('\n📋 Query SQL para inserir usuário:');
        console.log(`INSERT INTO users (
    id,
    email,
    password,
    name,
    role,
    permissions,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'usuario@exemplo.com',
    '${hash}',
    'Nome do Usuário',
    'admin',
    NULL,
    NOW(),
    NOW()
);`);
    } else {
        console.log('❌ Erro ao gerar hash da senha');
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { generatePasswordHash };