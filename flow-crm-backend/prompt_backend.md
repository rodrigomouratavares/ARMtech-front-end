# Flow CRM Backend - Prompt de Desenvolvimento Simplificado

## 🎯 Objetivo

Desenvolver uma API REST para o sistema Flow CRM usando Node.js, TypeScript, Fastify e PostgreSQL, baseada no frontend React existente.

## 📋 Stack Tecnológica

- **Runtime**: Node.js LTS
- **Linguagem**: TypeScript 5.0+
- **Framework**: Fastify 4.0+
- **ORM**: Drizzle ORM
- **Banco**: PostgreSQL 15+
- **Validação**: Zod
- **Autenticação**: JWT (jsonwebtoken)
- **Hashing**: bcrypt
- **Testes**: Vitest

## 🏗️ Estrutura do Projeto Simplificada

```
flow-crm-backend/
├── src/
│   ├── config/           # Configurações e variáveis de ambiente
│   ├── db/               # Conexão e schemas do banco
│   ├── routes/           # Rotas da API por entidade
│   ├── controllers/      # Controladores por entidade
│   ├── services/         # Serviços de negócio
│   ├── schemas/          # Validação com Zod e schemas Drizzle
│   ├── utils/            # Funções utilitárias
│   ├── plugins/          # Plugins Fastify (auth, banco, etc)
│   ├── app.ts           # Configuração da aplicação
│   └── server.ts        # Entrada principal
└── tests/               # Testes unitários e integração
```

## 🗄️ Entidades Principais

### Users (Autenticação)

```sql
- id (UUID, PK)
- email (string, unique)
- password (string, hashed)
- name (string)
- role (enum: admin, manager, employee)
- createdAt, updatedAt (timestamps)
```

### Customers (Clientes)

```sql
- id (UUID, PK)
- name (string)
- email (string)
- phone (string)
- cpf (string, unique, validated)
- address (text, nullable)
- createdAt, updatedAt (timestamps)
```

### Products (Produtos)

```sql
- id (UUID, PK)
- code (string, unique)
- name (string)
- unit (string)
- description (text, nullable)
- stock (integer, default: 0)
- purchasePrice (decimal)
- salePrice (decimal)
- saleType (string)
- createdAt, updatedAt (timestamps)
```

### PreSales (Pré-vendas)

```sql
- id (UUID, PK)
- customerId (UUID, FK -> customers.id)
- status (enum: draft, pending, approved, cancelled, converted)
- total (decimal)
- discount (decimal, default: 0)
- notes (text, nullable)
- createdAt, updatedAt (timestamps)

# PreSaleItems (Itens da pré-venda)
- id (UUID, PK)
- preSaleId (UUID, FK -> presales.id, cascade delete)
- productId (UUID, FK -> products.id)
- quantity (decimal)
- unitPrice (decimal)
- totalPrice (decimal)
- discount (decimal, default: 0)
```

## 🔗 Endpoints Principais

### Autenticação

- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/me` - Dados do usuário atual
- `POST /api/auth/register` - Cadastro (admin apenas)

### Clientes

- `GET /api/customers` - Listar com filtros
- `GET /api/customers/:id` - Buscar por ID
- `POST /api/customers` - Criar cliente
- `PUT /api/customers/:id` - Atualizar cliente
- `DELETE /api/customers/:id` - Excluir cliente

### Produtos

- `GET /api/products` - Listar com filtros
- `GET /api/products/:id` - Buscar por ID
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Excluir produto

### Pré-vendas

- `GET /api/presales` - Listar com filtros
- `GET /api/presales/:id` - Buscar por ID com itens
- `POST /api/presales` - Criar pré-venda
- `PUT /api/presales/:id` - Atualizar pré-venda
- `DELETE /api/presales/:id` - Excluir pré-venda
- `PUT /api/presales/:id/status` - Alterar status

## 🛡️ Requisitos de Segurança

- **JWT** para autenticação com roles (admin, manager, employee)
- **CORS** configurável
- **Validação** com Zod em todos os endpoints
- **Hash bcrypt** para senhas
- **Validação CPF** nos clientes

## 🔧 Configurações Básicas

### Variáveis de Ambiente (.env)

```bash
NODE_ENV=development
PORT=3333
DATABASE_URL=postgresql://user:password@localhost:5432/flowcrm
JWT_SECRET=sua-chave-secreta-jwt
JWT_EXPIRES_IN=7d
```

### Dependências Principais

```json
{
  "dependencies": {
    "fastify": "^4.24.0",
    "@fastify/cors": "^8.4.0",
    "drizzle-orm": "^0.28.6",
    "postgres": "^3.4.3",
    "zod": "^3.22.4",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "drizzle-kit": "^0.19.13",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.2.2",
    "vitest": "^0.34.6",
    "@types/node": "^20.8.9",
    "@types/bcrypt": "^5.0.1",
    "@types/jsonwebtoken": "^9.0.4"
  }
}
```

## 🚀 Setup Rápido

```bash
# 1. Criar projeto
mkdir flow-crm-backend && cd flow-crm-backend
npm init -y

# 2. Instalar dependências
npm install fastify @fastify/cors drizzle-orm postgres zod jsonwebtoken bcrypt

# 3. Instalar devDependencies
npm install -D drizzle-kit ts-node-dev typescript vitest @types/node @types/bcrypt @types/jsonwebtoken

# 4. Configurar scripts no package.json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "db:generate": "drizzle-kit generate:pg",
  "db:migrate": "drizzle-kit push:pg",
  "test": "vitest"
}
```

## 📝 Funcionalidades Essenciais

- Autenticação e autorização JWT
- CRUD completo para todas as entidades
- Validação de dados com Zod
- Validação de CPF para clientes brasileiros
- Sistema básico de controle de estoque
- Cálculos automáticos para totais de pré-vendas

## 📋 Checklist de Desenvolvimento

- [ ] Setup inicial do projeto
- [ ] Configuração do banco PostgreSQL
- [ ] Sistema de autenticação JWT
- [ ] CRUD completo de todas as entidades
- [ ] Validação com Zod
- [ ] Testes unitários básicos
