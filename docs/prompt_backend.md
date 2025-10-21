# Flow CRM Backend - Prompt de Desenvolvimento

## 🎯 Objetivo

Desenvolver uma API REST completa para o sistema Flow CRM usando Node.js, TypeScript, Fastify e PostgreSQL, baseada no frontend React existente.

## 📋 Stack Tecnológica

- **Runtime**: Node.js LTS
- **Linguagem**: TypeScript 5.0+
- **Framework**: Fastify 4.0+
- **ORM**: Drizzle ORM
- **Banco**: PostgreSQL 15+
- **Validação**: Zod
- **Autenticação**: JWT (@fastify/jwt)
- **Testes**: Vitest
- **Linter/Format**: Biome
- **Docs**: Swagger/OpenAPI

## 🏗️ Estrutura do Projeto

```
flow-crm-backend/
├── src/
│   ├── config/           # Configurações e variáveis de ambiente
│   ├── database/         # Conexão e schemas do banco
│   │   └── schema/       # Tabelas Drizzle (users, customers, products, presales)
│   ├── modules/          # Módulos por domínio
│   │   ├── auth/         # Autenticação e autorização
│   │   ├── customers/    # CRUD de clientes
│   │   ├── products/     # CRUD de produtos
│   │   ├── presales/     # CRUD de pré-vendas
│   │   └── dashboard/    # Métricas e relatórios
│   ├── schemas/          # Validação Zod
│   ├── shared/           # Utilitários compartilhados
│   │   ├── errors/       # Classes de erro customizadas
│   │   ├── middlewares/  # Middlewares de validação
│   │   └── utils/        # Funções utilitárias
│   ├── plugins/          # Plugins Fastify
│   ├── app.ts           # Configuração da aplicação
│   └── server.ts        # Entrada principal
├── tests/               # Testes unitários e integração
├── migrations/          # Migrações do banco
└── docker-compose.yml   # PostgreSQL para desenvolvimento
```

## 🗄️ Entidades Principais

### Users (Autenticação)

```sql
- id (UUID, PK)
- email (string, unique)
- password (string, hashed)
- name (string)
- role (enum: admin, manager, employee)
- avatar (string, nullable)
- lastLoginAt (timestamp)
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
- code (string, unique, auto-generated)
- name (string)
- unit (string)
- description (text, nullable)
- stock (integer, default: 0)
- saleType (enum: unit, fractional)
- purchasePrice (decimal)
- salePrice (decimal)
- suggestedSalePrice (decimal, nullable)
- category (string, nullable)
- createdAt, updatedAt (timestamps)
```

### PreSales (Pré-vendas)

```sql
- id (UUID, PK)
- customerId (UUID, FK -> customers.id)
- status (enum: draft, pending, approved, cancelled, converted)
- total (decimal)
- discount (decimal, default: 0)
- discountType (enum: percentage, fixed)
- notes (text, nullable)
- salesperson (string, nullable)
- createdAt, updatedAt (timestamps)

# PreSaleItems (Itens da pré-venda)
- id (UUID, PK)
- preSaleId (UUID, FK -> presales.id, cascade delete)
- productId (UUID, FK -> products.id)
- quantity (decimal)
- unitPrice (decimal)
- totalPrice (decimal)
- discount (decimal, default: 0)
- notes (text, nullable)
```

## 🔗 Endpoints Principais

### Autenticação

- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/refresh` - Renovar token JWT
- `GET /api/auth/me` - Dados do usuário atual
- `POST /api/auth/register` - Cadastro (admin apenas)

### Clientes

- `GET /api/customers` - Listar com filtros e paginação
- `GET /api/customers/:id` - Buscar por ID
- `POST /api/customers` - Criar cliente
- `PUT /api/customers/:id` - Atualizar cliente
- `DELETE /api/customers/:id` - Excluir cliente

### Produtos

- `GET /api/products` - Listar com filtros e paginação
- `GET /api/products/:id` - Buscar por ID
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Excluir produto
- `POST /api/products/:id/adjust-stock` - Ajustar estoque

### Pré-vendas

- `GET /api/presales` - Listar com filtros e paginação
- `GET /api/presales/:id` - Buscar por ID com itens
- `POST /api/presales` - Criar pré-venda
- `PUT /api/presales/:id` - Atualizar pré-venda
- `DELETE /api/presales/:id` - Excluir pré-venda
- `PUT /api/presales/:id/status` - Alterar status

## 🛡️ Requisitos de Segurança

- **JWT** para autenticação com roles (admin, manager, employee)
- **Helmet** para headers de segurança
- **Rate limiting** (100 req/min por IP)
- **CORS** configurável por ambiente
- **Validação** rigorosa com Zod em todos os endpoints
- **Sanitização** de entradas para prevenir XSS
- **Hash Argon2** para senhas
- **Validação CPF** nos clientes

## 🔧 Configurações Obrigatórias

### Variáveis de Ambiente (.env)

```bash
NODE_ENV=development
PORT=3333
DATABASE_URL=postgresql://user:password@localhost:5432/flowcrm
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
```

### Dependências Principais

```json
{
  "dependencies": {
    "fastify": "^4.24.0",
    "@fastify/cors": "^8.4.0",
    "@fastify/helmet": "^11.1.1",
    "@fastify/jwt": "^7.2.0",
    "@fastify/rate-limit": "^8.0.3",
    "@fastify/swagger": "^8.12.0",
    "@fastify/swagger-ui": "^2.0.0",
    "drizzle-orm": "^0.28.6",
    "postgres": "^3.4.3",
    "zod": "^3.22.4",
    "argon2": "^0.31.2",
    "pino": "^8.16.2",
    "env-var": "^7.4.1"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.4.1",
    "drizzle-kit": "^0.19.13",
    "tsx": "^3.14.0",
    "typescript": "^5.2.2",
    "vitest": "^0.34.6"
  }
}
```

## 🚀 Setup Rápido

```bash
# 1. Criar projeto
mkdir flow-crm-backend && cd flow-crm-backend
npm init -y

# 2. Instalar dependências
npm install fastify @fastify/cors @fastify/helmet @fastify/jwt @fastify/rate-limit @fastify/swagger @fastify/swagger-ui drizzle-orm postgres zod argon2 pino env-var

# 3. Instalar devDependencies
npm install -D @biomejs/biome drizzle-kit tsx typescript vitest @types/node

# 4. Configurar banco
docker run --name flowcrm-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=flowcrm -p 5432:5432 -d postgres:15

# 5. Configurar scripts no package.json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "db:generate": "drizzle-kit generate:pg",
  "db:migrate": "drizzle-kit push:pg",
  "test": "vitest",
  "lint": "biome lint ."
}
```

## 📝 Funcionalidades Especiais

### Sistema de Preços Inteligente

- Cálculo automático de preço de venda baseado no preço de compra
- Sugestão de margem de lucro padrão (30%)
- Validação: preço venda >= preço compra

### Geração Automática de Códigos

- Códigos de produtos auto-incrementais: PRD001, PRD002...
- Códigos únicos por entidade

### Sistema de Estoque

- Controle de estoque com ajustes manuais
- Produtos unitários ou fracionários
- Alertas de estoque baixo

### Validação Brasileira

- CPF com validação de dígitos verificadores
- Formatação de telefone brasileiro
- Máscaras de entrada padronizadas

## 🧪 Testes Essenciais

- **Auth**: Login, JWT, roles
- **CRUD**: Todas as entidades
- **Validação**: Schemas Zod
- **Segurança**: Rate limiting, sanitização
- **Business Logic**: Cálculos de preços, validação CPF

## 📚 Documentação

- Swagger UI disponível em `/docs`
- Health check em `/health`
- Logs estruturados com Pino
- Error handling centralizado

## 🔄 Integração Frontend

A API deve ser compatível com o frontend React existente que já possui:

- Sistema de autenticação mock
- Interfaces TypeScript definidas
- Componentes para todas as entidades
- Sistema de roteamento protegido

## 📋 Checklist de Desenvolvimento

- [ ] Setup inicial do projeto
- [ ] Configuração do banco PostgreSQL
- [ ] Sistema de autenticação JWT
- [ ] CRUD completo de todas as entidades
- [ ] Validação com Zod
- [ ] Testes unitários e integração
- [ ] Documentação Swagger
- [ ] Docker para desenvolvimento
- [ ] CI/CD pipeline
- [ ] Deploy em produção

---

**Documentação Completa**: Consulte `backend.md` para detalhes técnicos completos, exemplos de código e implementação avançada.

