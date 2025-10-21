# Flow CRM - Documentação Técnica do Backend

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Fastify](https://img.shields.io/badge/Fastify-4.0+-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 📑 Índice

1. [Visão Geral](#-visão-geral)
2. [Requisitos do Sistema](#-requisitos-do-sistema)
3. [Estrutura do Projeto](#-estrutura-do-projeto)
4. [Setup do Ambiente](#-setup-do-ambiente)
5. [Modelagem do Banco de Dados](#-modelagem-do-banco-de-dados)
6. [Configuração do Servidor Fastify](#-configuração-do-servidor-fastify)
7. [Autenticação e Autorização](#-autenticação-e-autorização)
8. [Validação com Zod](#-validação-com-zod)
9. [Design da API](#-design-da-api)
10. [Documentação Automática (Swagger)](#-documentação-automática-swagger)
11. [Segurança e Middlewares](#-segurança-e-middlewares)
12. [Logging e Tratamento de Erros](#-logging-e-tratamento-de-erros)
13. [Testes](#-testes)
14. [Deploy e Produção](#-deploy-e-produção)
15. [Referências](#-referências)

## 🚀 Visão Geral

O **Flow CRM Backend** é uma API REST moderna desenvolvida em Node.js com TypeScript, projetada para suportar um sistema completo de gerenciamento de vendas e relacionamento com clientes. A arquitetura é baseada em princípios de clean architecture, garantindo escalabilidade, manutenibilidade e testabilidade.

### Tecnologias Principais

- **Runtime**: Node.js 18+ (LTS)
- **Linguagem**: TypeScript 5.0+
- **Framework**: Fastify 4.0+
- **ORM**: Drizzle ORM
- **Banco de Dados**: PostgreSQL 15+
- **Validação**: Zod
- **Autenticação**: JWT
- **Documentação**: Swagger/OpenAPI
- **Testes**: Vitest
- **Linting/Formatting**: Biome
- **Build**: tsup/esbuild

### Funcionalidades Principais

- ✅ **Gestão de Produtos**: CRUD completo com categorização e controle de estoque
- ✅ **Gestão de Clientes**: Cadastro, validação de CPF e histórico de compras
- ✅ **Pré-Vendas**: Sistema completo de orçamentos e propostas
- ✅ **Autenticação JWT**: Sistema seguro de login e autorização
- ✅ **Inventário**: Controle de estoque com ajustes e relatórios
- ✅ **Dashboard**: Métricas e indicadores de performance
- ✅ **Relatórios**: Exportação de dados em diversos formatos

## 🔧 Requisitos do Sistema

### Requisitos Mínimos

- **Node.js**: 18.0.0+ (LTS recomendado)
- **npm**: 9.0.0+ ou **pnpm**: 8.0.0+ (recomendado)
- **PostgreSQL**: 15.0+
- **RAM**: 2GB (desenvolvimento), 4GB+ (produção)
- **Disco**: 1GB livres

### Variáveis de Ambiente Obrigatórias

```bash
NODE_ENV=development
PORT=3333
DATABASE_URL=postgresql://user:password@localhost:5432/flowcrm
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

## 📁 Estrutura do Projeto

```
flow-crm-backend/
├── .env.example                 # Exemplo de variáveis de ambiente
├── .gitignore                   # Arquivos ignorados pelo Git
├── biome.json                   # Configuração do Biome
├── docker-compose.yml           # Serviços Docker para desenvolvimento
├── Dockerfile                   # Multi-stage build para produção
├── package.json                 # Dependências e scripts
├── tsconfig.json               # Configuração TypeScript
├── vitest.config.ts            # Configuração de testes
├── drizzle.config.ts           # Configuração Drizzle ORM
├── migrations/                 # Migrações do banco de dados
│   ├── 0001_create_users.sql
│   ├── 0002_create_customers.sql
│   └── ...
├── src/
│   ├── config/                 # Configurações da aplicação
│   │   ├── database.ts
│   │   ├── environment.ts
│   │   └── index.ts
│   ├── schemas/                # Schemas Zod para validação
│   │   ├── auth.schema.ts
│   │   ├── customer.schema.ts
│   │   ├── product.schema.ts
│   │   └── presale.schema.ts
│   ├── database/               # Configuração do banco
│   │   ├── connection.ts
│   │   ├── migrations/
│   │   └── schema/
│   │       ├── users.ts
│   │       ├── customers.ts
│   │       ├── products.ts
│   │       └── presales.ts
│   ├── modules/                # Módulos por domínio
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.types.ts
│   │   ├── customers/
│   │   ├── products/
│   │   ├── presales/
│   │   └── dashboard/
│   ├── shared/                 # Utilitários compartilhados
│   │   ├── errors/
│   │   ├── middlewares/
│   │   ├── utils/
│   │   └── types/
│   ├── plugins/                # Plugins Fastify
│   │   ├── authentication.ts
│   │   ├── cors.ts
│   │   └── swagger.ts
│   ├── app.ts                  # Configuração da aplicação
│   └── server.ts               # Entrada principal
├── tests/                      # Testes
│   ├── __mocks__/             # Mocks para testes
│   ├── fixtures/              # Dados de teste
│   ├── integration/           # Testes de integração
│   ├── unit/                  # Testes unitários
│   └── setup.ts               # Setup dos testes
└── docs/                       # Documentação adicional
    ├── api.md
    ├── deployment.md
    └── architecture.md
```

## 🛠 Setup do Ambiente

### 1. Pré-requisitos

```bash
# Instalar Node.js via nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
nvm install 18
nvm use 18

# Habilitar pnpm via corepack
corepack enable
corepack prepare pnpm@latest --activate
```

### 2. Instalação do Projeto

```bash
# Clonar repositório
git clone <repository-url>
cd flow-crm-backend

# Instalar dependências
pnpm install

# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar banco de dados
docker-compose up -d postgres

# Executar migrações
pnpm db:migrate

# Iniciar servidor de desenvolvimento
pnpm dev
```

### 3. Dependências

#### Runtime Dependencies

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
    "pino-pretty": "^10.2.3",
    "env-var": "^7.4.1",
    "dayjs": "^1.11.10"
  }
}
```

#### Development Dependencies

```json
{
  "devDependencies": {
    "@biomejs/biome": "^1.4.1",
    "@types/node": "^20.8.10",
    "drizzle-kit": "^0.19.13",
    "tsup": "^7.2.0",
    "tsx": "^3.14.0",
    "typescript": "^5.2.2",
    "vitest": "^0.34.6",
    "@vitest/ui": "^0.34.6",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.16"
  }
}
```

### 4. Scripts do Package.json

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsup",
    "start": "node dist/server.js",
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "lint": "biome lint .",
    "format": "biome format . --write",
    "check": "biome check . --write",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  }
}
```

## 🗄 Modelagem do Banco de Dados

### Diagrama de Entidades (Conceitual)

```
┌─────────────┐    ┌─────────────────┐    ┌──────────────┐
│    Users    │    │   Customers     │    │   Products   │
├─────────────┤    ├─────────────────┤    ├──────────────┤
│ id (UUID)   │    │ id (UUID)       │    │ id (UUID)    │
│ email       │    │ name            │    │ code         │
│ password    │    │ email           │    │ name         │
│ name        │    │ phone           │    │ unit         │
│ role        │    │ cpf             │    │ stock        │
│ created_at  │    │ address         │    │ sale_type    │
│ updated_at  │    │ created_at      │    │ purchase_$   │
└─────────────┘    │ updated_at      │    │ sale_price   │
                   └─────────────────┘    │ category     │
                                          │ created_at   │
                   ┌─────────────────┐    │ updated_at   │
                   │   PreSales      │    └──────────────┘
                   ├─────────────────┤             │
                   │ id (UUID)       │             │
                   │ customer_id ────┼─────────────┤
                   │ status          │
                   │ total           │    ┌──────────────┐
                   │ discount        │    │ PreSaleItems │
                   │ notes           │    ├──────────────┤
                   │ salesperson     │    │ id (UUID)    │
                   │ created_at      │    │ presale_id ──┼──┐
                   │ updated_at      │    │ product_id ──┼──┼───┐
                   └─────────────────┘    │ quantity     │  │   │
                            │             │ unit_price   │  │   │
                            └─────────────┤ total_price  │  │   │
                                         │ discount     │  │   │
                                         │ notes        │  │   │
                                         └──────────────┘  │   │
                                                  ┌────────┘   │
                                                  │            │
                                                  └────────────┘
```

### Schema Drizzle

#### 1. Users Table

```typescript
// src/database/schema/users.ts
import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'employee']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('employee'),
  avatar: varchar('avatar', { length: 500 }),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

#### 2. Customers Table

```typescript
// src/database/schema/customers.ts
import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  cpf: varchar('cpf', { length: 14 }).notNull().unique(),
  address: text('address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
```

#### 3. Products Table

```typescript
// src/database/schema/products.ts
import { pgTable, uuid, varchar, timestamp, text, decimal, integer, pgEnum } from 'drizzle-orm/pg-core';

export const saleTypeEnum = pgEnum('sale_type', ['unit', 'fractional']);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  description: text('description'),
  stock: integer('stock').notNull().default(0),
  saleType: saleTypeEnum('sale_type').notNull().default('unit'),
  purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal('sale_price', { precision: 10, scale: 2 }).notNull(),
  suggestedSalePrice: decimal('suggested_sale_price', { precision: 10, scale: 2 }),
  category: varchar('category', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

#### 4. PreSales and PreSaleItems Tables

```typescript
// src/database/schema/presales.ts
import { pgTable, uuid, varchar, timestamp, text, decimal, integer, pgEnum } from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { products } from './products';

export const preSaleStatusEnum = pgEnum('presale_status', [
  'draft', 'pending', 'approved', 'cancelled', 'converted'
]);

export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed']);

export const preSales = pgTable('presales', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  status: preSaleStatusEnum('status').notNull().default('draft'),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  discountType: discountTypeEnum('discount_type').default('percentage'),
  notes: text('notes'),
  salesperson: varchar('salesperson', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const preSaleItems = pgTable('presale_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  preSaleId: uuid('presale_id').notNull().references(() => preSales.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  notes: text('notes'),
});

export type PreSale = typeof preSales.$inferSelect;
export type NewPreSale = typeof preSales.$inferInsert;
export type PreSaleItem = typeof preSaleItems.$inferSelect;
export type NewPreSaleItem = typeof preSaleItems.$inferInsert;
```

### Configuração Drizzle

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import { env } from './src/config/environment';

export default {
  schema: './src/database/schema/*',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

```typescript
// src/database/connection.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/environment';
import * as users from './schema/users';
import * as customers from './schema/customers';
import * as products from './schema/products';
import * as presales from './schema/presales';

const schema = {
  ...users,
  ...customers,
  ...products,
  ...presales,
};

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });

export type Database = typeof db;
```

## ⚡ Configuração do Servidor Fastify

### Estrutura Principal

```typescript
// src/app.ts
import fastify from 'fastify';
import { env } from './config/environment';

// Plugins
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

// Routes
import { authRoutes } from './modules/auth/auth.routes';
import { customerRoutes } from './modules/customers/customer.routes';
import { productRoutes } from './modules/products/product.routes';
import { preSaleRoutes } from './modules/presales/presale.routes';

// Shared
import { authenticationPlugin } from './plugins/authentication';
import { errorHandler } from './shared/errors/errorHandler';

export async function buildApp() {
  const app = fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
  });

  // Security plugins
  await app.register(helmet);
  await app.register(cors, {
    origin: env.NODE_ENV === 'development' 
      ? ['http://localhost:5173', 'http://localhost:3000']
      : env.ALLOWED_ORIGINS.split(','),
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      code: 'RATE_LIMIT_EXCEEDED',
      error: 'Rate Limit Exceeded',
      message: 'Too many requests, please try again later.',
    }),
  });

  // JWT
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  // Authentication plugin
  await app.register(authenticationPlugin);

  // Swagger documentation
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'Flow CRM API',
        description: 'API for Flow CRM system',
        version: '1.0.0',
      },
      host: `localhost:${env.PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'JWT Authorization header using the Bearer scheme.',
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  });

  // Health check
  app.get('/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
          },
        },
      },
    },
  }, async () => ({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(customerRoutes, { prefix: '/api/customers' });
  await app.register(productRoutes, { prefix: '/api/products' });
  await app.register(preSaleRoutes, { prefix: '/api/presales' });

  // Error handler
  app.setErrorHandler(errorHandler);

  return app;
}
```

```typescript
// src/server.ts
import { buildApp } from './app';
import { env } from './config/environment';

async function start() {
  try {
    const app = await buildApp();
    
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });
    
    console.log(`🚀 Server ready at http://localhost:${env.PORT}`);
    console.log(`📚 Documentation at http://localhost:${env.PORT}/docs`);
    
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();
```

## 🔐 Autenticação e Autorização

### Plugin de Autenticação

```typescript
// src/plugins/authentication.ts
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

const authenticationPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      const payload = await request.jwtVerify<JWTPayload>();
      request.user = payload;
    } catch (err) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  });

  fastify.decorate('authorize', (roles: string[]) => {
    return async function (request, reply) {
      await fastify.authenticate(request, reply);
      
      if (!request.user || !roles.includes(request.user.role)) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
      }
    };
  });
};

export { authenticationPlugin };
export default fp(authenticationPlugin);
```

### Serviço de Autenticação

```typescript
// src/modules/auth/auth.service.ts
import { eq } from 'drizzle-orm';
import argon2 from 'argon2';
import { db } from '../../database/connection';
import { users } from '../../database/schema/users';
import { AppError } from '../../shared/errors/AppError';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  async login(credentials: LoginCredentials) {
    const { email, password } = credentials;

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.password, password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Prepare token payload
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        lastLoginAt: new Date(),
      },
      payload,
    };
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }) {
    const { email, password, name, role = 'employee' } = userData;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existingUser) {
      throw new AppError('User already exists', 409, 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await argon2.hash(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: role as any,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });

    return newUser;
  }

  async refreshToken(payload: TokenPayload) {
    // Verify user still exists and is active
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId));

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
```

### Rotas de Autenticação

```typescript
// src/modules/auth/auth.routes.ts
import { FastifyPluginAsync } from 'fastify';
import { AuthService } from './auth.service';
import { loginSchema, registerSchema } from '../../schemas/auth.schema';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService();

  // Login
  fastify.post('/login', {
    schema: {
      body: loginSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                avatar: { type: 'string', nullable: true },
              },
            },
            token: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const credentials = request.body as any;
    const { user, payload } = await authService.login(credentials);
    const token = fastify.jwt.sign(payload);

    reply.send({ user, token });
  });

  // Register
  fastify.post('/register', {
    preHandler: fastify.authorize(['admin']),
    schema: {
      body: registerSchema,
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const userData = request.body as any;
    const user = await authService.register(userData);
    
    reply.code(201).send(user);
  });

  // Refresh token
  fastify.post('/refresh', {
    preHandler: fastify.authenticate,
    schema: {
      security: [{ Bearer: [] }],
    },
  }, async (request, reply) => {
    const payload = await authService.refreshToken(request.user!);
    const token = fastify.jwt.sign(payload);
    
    reply.send({ token });
  });

  // Get current user
  fastify.get('/me', {
    preHandler: fastify.authenticate,
    schema: {
      security: [{ Bearer: [] }],
    },
  }, async (request) => {
    const [user] = await fastify.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        avatar: users.avatar,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.id, request.user!.userId));

    return user;
  });
};

export { authRoutes };
```

## ✅ Validação com Zod

### Schemas de Validação

```typescript
// src/schemas/auth.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Senha deve conter ao menos uma letra minúscula, uma maiúscula e um número'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  role: z.enum(['admin', 'manager', 'employee']).optional(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
```

```typescript
// src/schemas/customer.schema.ts
import { z } from 'zod';

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().regex(phoneRegex, 'Formato de telefone inválido'),
  cpf: z.string()
    .regex(cpfRegex, 'Formato de CPF inválido')
    .refine(validateCPF, 'CPF inválido'),
  address: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerParamsSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const customerQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'email', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// CPF validation function
function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  digit = 11 - (sum % 11);
  if (digit === 10 || digit === 11) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
}

export type CreateCustomerSchema = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerSchema = z.infer<typeof updateCustomerSchema>;
export type CustomerParamsSchema = z.infer<typeof customerParamsSchema>;
export type CustomerQuerySchema = z.infer<typeof customerQuerySchema>;
```

```typescript
// src/schemas/product.schema.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  code: z.string().min(3, 'Código deve ter no mínimo 3 caracteres').optional(),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  description: z.string().optional(),
  saleType: z.enum(['unit', 'fractional']).default('unit'),
  purchasePrice: z.number()
    .positive('Preço de compra deve ser positivo')
    .transform(val => Number(val.toFixed(2))),
  salePrice: z.number()
    .positive('Preço de venda deve ser positivo')
    .transform(val => Number(val.toFixed(2))),
  stock: z.number().int().min(0, 'Estoque não pode ser negativo').default(0),
  category: z.string().optional(),
}).refine(data => data.salePrice >= data.purchasePrice, {
  message: 'Preço de venda deve ser maior ou igual ao preço de compra',
  path: ['salePrice'],
});

export const updateProductSchema = createProductSchema
  .partial()
  .omit({ code: true }); // Code cannot be updated

export const productParamsSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  saleType: z.enum(['unit', 'fractional']).optional(),
  minStock: z.coerce.number().min(0).optional(),
  maxStock: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['name', 'code', 'stock', 'salePrice', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateProductSchema = z.infer<typeof createProductSchema>;
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
export type ProductParamsSchema = z.infer<typeof productParamsSchema>;
export type ProductQuerySchema = z.infer<typeof productQuerySchema>;
```

### Middleware de Validação

```typescript
// src/shared/middlewares/validation.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export function validateBody(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        reply.code(400).send({
          error: 'Validation Error',
          message: 'Dados inválidos',
          details: messages,
        });
        return;
      }
      throw error;
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.params = schema.parse(request.params);
    } catch (error) {
      if (error instanceof ZodError) {
        reply.code(400).send({
          error: 'Validation Error',
          message: 'Parâmetros inválidos',
          details: error.errors,
        });
        return;
      }
      throw error;
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.query = schema.parse(request.query);
    } catch (error) {
      if (error instanceof ZodError) {
        reply.code(400).send({
          error: 'Validation Error',
          message: 'Query parameters inválidos',
          details: error.errors,
        });
        return;
      }
      throw error;
    }
  };
}
```

## 🔗 Design da API

### Endpoints por Entidade

#### Authentication Endpoints

| Método | Rota | Descrição | Autenticação | Body Schema |
|--------|------|-----------|--------------|-------------|
| POST | `/api/auth/login` | Login de usuário | ❌ | `loginSchema` |
| POST | `/api/auth/register` | Cadastro de usuário | ✅ (admin) | `registerSchema` |
| POST | `/api/auth/refresh` | Renovar token | ✅ | - |
| GET | `/api/auth/me` | Dados do usuário logado | ✅ | - |
| POST | `/api/auth/logout` | Logout | ✅ | - |

#### Customer Endpoints

| Método | Rota | Descrição | Autenticação | Query/Body Schema |
|--------|------|-----------|--------------|-------------------|
| GET | `/api/customers` | Listar clientes | ✅ | `customerQuerySchema` |
| GET | `/api/customers/:id` | Buscar cliente | ✅ | `customerParamsSchema` |
| POST | `/api/customers` | Criar cliente | ✅ | `createCustomerSchema` |
| PUT | `/api/customers/:id` | Atualizar cliente | ✅ | `updateCustomerSchema` |
| DELETE | `/api/customers/:id` | Excluir cliente | ✅ (admin/manager) | `customerParamsSchema` |
| GET | `/api/customers/search` | Busca de clientes | ✅ | query: `{ q: string }` |

#### Product Endpoints

| Método | Rota | Descrição | Autenticação | Query/Body Schema |
|--------|------|-----------|--------------|-------------------|
| GET | `/api/products` | Listar produtos | ✅ | `productQuerySchema` |
| GET | `/api/products/:id` | Buscar produto | ✅ | `productParamsSchema` |
| POST | `/api/products` | Criar produto | ✅ | `createProductSchema` |
| PUT | `/api/products/:id` | Atualizar produto | ✅ | `updateProductSchema` |
| DELETE | `/api/products/:id` | Excluir produto | ✅ (admin/manager) | `productParamsSchema` |
| GET | `/api/products/search` | Busca de produtos | ✅ | query: `{ q: string }` |
| POST | `/api/products/:id/adjust-stock` | Ajustar estoque | ✅ | `stockAdjustmentSchema` |

#### PreSale Endpoints

| Método | Rota | Descrição | Autenticação | Query/Body Schema |
|--------|------|-----------|--------------|-------------------|
| GET | `/api/presales` | Listar pré-vendas | ✅ | `preSaleQuerySchema` |
| GET | `/api/presales/:id` | Buscar pré-venda | ✅ | `preSaleParamsSchema` |
| POST | `/api/presales` | Criar pré-venda | ✅ | `createPreSaleSchema` |
| PUT | `/api/presales/:id` | Atualizar pré-venda | ✅ | `updatePreSaleSchema` |
| DELETE | `/api/presales/:id` | Excluir pré-venda | ✅ (admin/manager) | `preSaleParamsSchema` |
| PUT | `/api/presales/:id/status` | Alterar status | ✅ | `updateStatusSchema` |
| POST | `/api/presales/:id/convert` | Converter em venda | ✅ | - |

### Exemplos de Resposta

#### Sucesso (200/201)

```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "João Silva",
    "email": "joao@email.com",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

#### Lista com Paginação (200)

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "João Silva"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Erro de Validação (400)

```json
{
  "error": "Validation Error",
  "message": "Dados inválidos",
  "details": [
    {
      "field": "email",
      "message": "E-mail inválido"
    },
    {
      "field": "password",
      "message": "Senha deve ter no mínimo 8 caracteres"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Erro de Autenticação (401)

```json
{
  "error": "Unauthorized",
  "message": "Token inválido ou expirado",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Erro de Autorização (403)

```json
{
  "error": "Forbidden",
  "message": "Permissões insuficientes",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Erro Interno (500)

```json
{
  "error": "Internal Server Error",
  "message": "Algo deu errado. Tente novamente mais tarde.",
  "requestId": "req_123456789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📚 Documentação Automática (Swagger)

### Configuração do Swagger

```typescript
// src/plugins/swagger.ts
import { FastifyPluginAsync } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from '../config/environment';

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Flow CRM API',
        description: `
          API REST para sistema de gerenciamento de vendas e relacionamento com clientes.
          
          ## Autenticação
          
          Esta API utiliza JWT (JSON Web Token) para autenticação. Para acessar endpoints protegidos:
          
          1. Faça login via \`POST /api/auth/login\`
          2. Use o token retornado no header: \`Authorization: Bearer <token>\`
          
          ## Paginação
          
          Endpoints de listagem suportam paginação via query parameters:
          - \`page\`: Número da página (default: 1)
          - \`limit\`: Itens por página (default: 20, max: 100)
          
          ## Filtros
          
          Muitos endpoints suportam filtros via query parameters. Consulte cada endpoint específico.
        `,
        version: '1.0.0',
        contact: {
          name: 'Flow CRM Team',
          email: 'dev@flowcrm.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      host: env.NODE_ENV === 'production' ? 'api.flowcrm.com' : `localhost:${env.PORT}`,
      schemes: env.NODE_ENV === 'production' ? ['https'] : ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        {
          name: 'Authentication',
          description: 'Endpoints de autenticação e autorização',
        },
        {
          name: 'Customers',
          description: 'Gerenciamento de clientes',
        },
        {
          name: 'Products',
          description: 'Gerenciamento de produtos',
        },
        {
          name: 'PreSales',
          description: 'Gerenciamento de pré-vendas',
        },
        {
          name: 'Dashboard',
          description: 'Métricas e indicadores',
        },
      ],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'JWT Authorization header usando Bearer scheme. Exemplo: "Bearer {token}"',
        },
      },
      security: [
        {
          Bearer: [],
        },
      ],
    },
    transform: ({ schema, url }) => {
      // Remove security requirement from public endpoints
      if (url?.includes('/auth/login') || url?.includes('/health')) {
        delete schema.security;
      }
      return schema;
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
      displayOperationId: false,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
};

export { swaggerPlugin };
```

### Schemas para Swagger

```typescript
// src/shared/schemas/swagger.ts
export const swaggerSchemas = {
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      role: { type: 'string', enum: ['admin', 'manager', 'employee'] },
      avatar: { type: 'string', nullable: true },
      lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  
  Customer: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      phone: { type: 'string' },
      cpf: { type: 'string' },
      address: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  
  Product: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      code: { type: 'string' },
      name: { type: 'string' },
      unit: { type: 'string' },
      description: { type: 'string', nullable: true },
      stock: { type: 'integer' },
      saleType: { type: 'string', enum: ['unit', 'fractional'] },
      purchasePrice: { type: 'number', format: 'decimal' },
      salePrice: { type: 'number', format: 'decimal' },
      suggestedSalePrice: { type: 'number', format: 'decimal', nullable: true },
      category: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  
  Error: {
    type: 'object',
    properties: {
      error: { type: 'string' },
      message: { type: 'string' },
      details: { type: 'array', items: { type: 'object' } },
      timestamp: { type: 'string', format: 'date-time' },
      requestId: { type: 'string' },
    },
  },
  
  PaginationMeta: {
    type: 'object',
    properties: {
      page: { type: 'integer' },
      limit: { type: 'integer' },
      total: { type: 'integer' },
      totalPages: { type: 'integer' },
      hasNext: { type: 'boolean' },
      hasPrev: { type: 'boolean' },
    },
  },
};
```

### Exemplo de Rota com Documentação

```typescript
// Exemplo em customer.routes.ts
fastify.get('/customers', {
  schema: {
    tags: ['Customers'],
    summary: 'Listar clientes',
    description: 'Retorna lista paginada de clientes com filtros opcionais',
    security: [{ Bearer: [] }],
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        search: { type: 'string', description: 'Busca por nome, email ou CPF' },
        sortBy: { type: 'string', enum: ['name', 'email', 'createdAt'], default: 'createdAt' },
        sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/definitions/Customer' },
          },
          meta: {
            type: 'object',
            properties: {
              pagination: { $ref: '#/definitions/PaginationMeta' },
            },
          },
        },
      },
      401: { $ref: '#/definitions/Error' },
      500: { $ref: '#/definitions/Error' },
    },
  },
  preHandler: fastify.authenticate,
}, async (request) => {
  // Implementation...
});
```

## 🛡 Segurança e Middlewares

### Middlewares de Segurança

```typescript
// src/plugins/security.ts
import { FastifyPluginAsync } from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import { env } from '../config/environment';

const securityPlugin: FastifyPluginAsync = async (fastify) => {
  // Helmet for security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: (origin, callback) => {
      const hostname = new URL(origin || 'http://localhost').hostname;
      
      if (env.NODE_ENV === 'development') {
        // Allow all origins in development
        callback(null, true);
        return;
      }
      
      // Production CORS policy
      const allowedOrigins = env.ALLOWED_ORIGINS.split(',');
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed === '*') return true;
        if (allowed.startsWith('*.')) {
          const domain = allowed.slice(2);
          return hostname.endsWith(domain);
        }
        return hostname === allowed;
      });
      
      callback(null, isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    errorResponseBuilder: () => ({
      error: 'Rate Limit Exceeded',
      message: 'Muitas requisições. Tente novamente em alguns minutos.',
      statusCode: 429,
    }),
    keyGenerator: (request) => {
      return request.headers['x-forwarded-for'] || request.ip;
    },
    skipOnError: true,
  });

  // Request size limit
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.headers['content-length']) {
      const contentLength = parseInt(request.headers['content-length'], 10);
      if (contentLength > env.MAX_REQUEST_SIZE) {
        reply.code(413).send({
          error: 'Payload Too Large',
          message: 'Request body exceeds maximum allowed size',
        });
      }
    }
  });
};

export { securityPlugin };
```

### Sanitização e Validação

```typescript
// src/shared/utils/sanitize.ts
import validator from 'validator';

export function sanitizeString(str: string): string {
  return validator.escape(str.trim());
}

export function sanitizeEmail(email: string): string {
  return validator.normalizeEmail(email) || '';
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function sanitizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function isValidUUID(id: string): boolean {
  return validator.isUUID(id, 4);
}

export function preventXSS(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(preventXSS);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = preventXSS(value);
    }
    return sanitized;
  }
  
  return obj;
}
```

### Hash de Senhas

```typescript
// src/shared/utils/password.ts
import argon2 from 'argon2';

export class PasswordService {
  private static readonly options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  };

  static async hash(password: string): Promise<string> {
    return argon2.hash(password, this.options);
  }

  static async verify(hashedPassword: string, password: string): Promise<boolean> {
    return argon2.verify(hashedPassword, password);
  }

  static validateStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('Use pelo menos 8 caracteres');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Inclua letras minúsculas');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Inclua letras maiúsculas');

    if (/\d/.test(password)) score++;
    else feedback.push('Inclua números');

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('Inclua símbolos especiais');

    return {
      isValid: score >= 4,
      score,
      feedback,
    };
  }
}
```

## 📊 Logging e Tratamento de Erros

### Configuração de Logging

```typescript
// src/config/logger.ts
import pino from 'pino';
import { env } from './environment';

const loggerConfig = {
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        levelFirst: true,
        messageFormat: '{levelName} - {msg}',
      },
    },
  }),
  ...(env.NODE_ENV === 'production' && {
    formatters: {
      level: (label) => ({ level: label }),
      log: (obj) => ({
        ...obj,
        environment: env.NODE_ENV,
        version: process.env.npm_package_version,
      }),
    },
  }),
};

export const logger = pino(loggerConfig);
```

### Classes de Erro Customizadas

```typescript
// src/shared/errors/AppError.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any[]) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    
    if (details) {
      (this as any).details = details;
    }
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}
```

### Error Handler Global

```typescript
// src/shared/errors/errorHandler.ts
import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './AppError';
import { logger } from '../../config/logger';
import { env } from '../../config/environment';

interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
  stack?: string;
}

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = request.headers['x-request-id'] as string;
  
  // Log the error
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    },
    request: {
      id: requestId,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    },
  }, 'Request error');

  const response: ErrorResponse = {
    error: error.name,
    message: error.message,
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Handle different error types
  if (error instanceof AppError) {
    response.error = error.constructor.name;
    response.message = error.message;
    
    if ((error as any).details) {
      response.details = (error as any).details;
    }
    
    reply.code(error.statusCode).send(response);
    return;
  }

  if (error instanceof ZodError) {
    response.error = 'ValidationError';
    response.message = 'Dados inválidos';
    response.details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      value: err.input,
    }));
    
    reply.code(400).send(response);
    return;
  }

  // Handle Fastify validation errors
  if (error.validation) {
    response.error = 'ValidationError';
    response.message = 'Dados inválidos';
    response.details = error.validation;
    
    reply.code(400).send(response);
    return;
  }

  // Handle JWT errors
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    response.error = 'UnauthorizedError';
    response.message = 'Token de acesso obrigatório';
    
    reply.code(401).send(response);
    return;
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    response.error = 'UnauthorizedError';
    response.message = 'Token de acesso inválido';
    
    reply.code(401).send(response);
    return;
  }

  // Handle database errors (example for PostgreSQL)
  if (error.code === '23505') { // Unique violation
    response.error = 'ConflictError';
    response.message = 'Registro já existe';
    
    reply.code(409).send(response);
    return;
  }

  if (error.code === '23503') { // Foreign key violation
    response.error = 'ConflictError';
    response.message = 'Referência inválida';
    
    reply.code(409).send(response);
    return;
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    response.error = 'RateLimitError';
    response.message = 'Muitas requisições. Tente novamente em alguns minutos.';
    
    reply.code(429).send(response);
    return;
  }

  // Generic server errors
  response.error = 'InternalServerError';
  response.message = 'Erro interno do servidor';
  
  // Only include stack trace in development
  if (env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  reply.code(500).send(response);
}
```

### Hook de Request ID

```typescript
// src/plugins/requestId.ts
import { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';

const requestIdPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const requestId = (request.headers['x-request-id'] as string) || randomUUID();
    request.headers['x-request-id'] = requestId;
    reply.header('X-Request-ID', requestId);
  });
};

export { requestIdPlugin };
```

## 🧪 Testes

### Configuração do Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'coverage/',
        'dist/',
        'migrations/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@tests': resolve(__dirname, 'tests'),
    },
  },
});
```

### Setup de Testes

```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';
import { db } from '../src/database/connection';
import { users, customers, products, preSales, preSaleItems } from '../src/database/schema';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
  
  // Setup test database
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/flowcrm_test';
});

beforeEach(async () => {
  // Clean database before each test
  await db.delete(preSaleItems);
  await db.delete(preSales);
  await db.delete(products);
  await db.delete(customers);
  await db.delete(users);
});

afterEach(async () => {
  // Clean up after each test
});

afterAll(async () => {
  await app?.close();
});

export { app };
```

### Testes Unitários

```typescript
// tests/unit/services/auth.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '@/modules/auth/auth.service';
import { db } from '@/database/connection';
import { users } from '@/database/schema';
import { PasswordService } from '@/shared/utils/password';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: await PasswordService.hash('password123'),
        name: 'Test User',
        role: 'employee' as const,
      };
      
      const [user] = await db.insert(users).values(userData).returning();

      // Act
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Assert
      expect(result).toMatchObject({
        user: {
          id: user.id,
          email: 'test@example.com',
          name: 'Test User',
          role: 'employee',
        },
        payload: {
          userId: user.id,
          email: 'test@example.com',
          role: 'employee',
        },
      });
    });

    it('should throw error with invalid email', async () => {
      // Act & Assert
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with invalid password', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: await PasswordService.hash('password123'),
        name: 'Test User',
        role: 'employee' as const,
      };
      
      await db.insert(users).values(userData);

      // Act & Assert
      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      // Act
      const result = await authService.register({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        role: 'employee',
      });

      // Assert
      expect(result).toMatchObject({
        email: 'new@example.com',
        name: 'New User',
        role: 'employee',
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      await authService.register({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      });

      // Act & Assert
      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password456',
          name: 'Another User',
        })
      ).rejects.toThrow('User already exists');
    });
  });
});
```

### Testes de Integração

```typescript
// tests/integration/auth.routes.test.ts
import { describe, it, expect } from 'vitest';
import { app } from '../setup';
import { db } from '@/database/connection';
import { users } from '@/database/schema';
import { PasswordService } from '@/shared/utils/password';

describe('Auth Routes', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      await db.insert(users).values({
        email: 'test@example.com',
        password: await PasswordService.hash('password123'),
        name: 'Test User',
        role: 'employee',
      });

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        user: {
          email: 'test@example.com',
          name: 'Test User',
          role: 'employee',
        },
        token: expect.any(String),
      });
    });

    it('should return 401 for invalid credentials', async () => {
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      // Assert
      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('UnauthorizedError');
    });

    it('should return 400 for invalid email format', async () => {
      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'invalid-email',
          password: 'password123',
        },
      });

      // Assert
      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('ValidationError');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user data', async () => {
      // Arrange
      const [user] = await db.insert(users).values({
        email: 'test@example.com',
        password: await PasswordService.hash('password123'),
        name: 'Test User',
        role: 'employee',
      }).returning();

      const token = app.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      // Assert
      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        id: user.id,
        email: 'test@example.com',
        name: 'Test User',
        role: 'employee',
      });
    });

    it('should return 401 without token', async () => {
      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
      });

      // Assert
      expect(response.statusCode).toBe(401);
    });
  });
});
```

### Docker Compose para Testes

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres-test:
    image: postgres:15
    container_name: flowcrm-postgres-test
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: flowcrm_test
    ports:
      - "5433:5432"
    volumes:
      - test_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  test_postgres_data:
```

## 🚀 Deploy e Produção

### Dockerfile

```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile --production=false

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN corepack enable pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set permissions
USER nodejs

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    http.get('http://localhost:3333/health', (res) => { \
      if (res.statusCode === 200) process.exit(0); \
      else process.exit(1); \
    }).on('error', () => process.exit(1));"

# Start the application
CMD ["node", "dist/server.js"]
```

### Docker Compose para Desenvolvimento

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    container_name: flowcrm-api
    ports:
      - "3333:3333"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://flowcrm:password@postgres:5432/flowcrm
      - JWT_SECRET=your-super-secret-jwt-key-for-development
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
    restart: unless-stopped

  postgres:
    image: postgres:15
    container_name: flowcrm-postgres
    environment:
      POSTGRES_USER: flowcrm
      POSTGRES_PASSWORD: password
      POSTGRES_DB: flowcrm
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U flowcrm"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: flowcrm-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Configuração de Ambiente

```typescript
// src/config/environment.ts
import env from 'env-var';

export const config = {
  NODE_ENV: env.get('NODE_ENV').default('development').asString(),
  PORT: env.get('PORT').default('3333').asPortNumber(),
  
  // Database
  DATABASE_URL: env.get('DATABASE_URL').required().asString(),
  
  // JWT
  JWT_SECRET: env.get('JWT_SECRET').required().asString(),
  JWT_EXPIRES_IN: env.get('JWT_EXPIRES_IN').default('7d').asString(),
  
  // Security
  ALLOWED_ORIGINS: env.get('ALLOWED_ORIGINS').default('*').asString(),
  RATE_LIMIT_MAX: env.get('RATE_LIMIT_MAX').default('100').asInt(),
  RATE_LIMIT_WINDOW: env.get('RATE_LIMIT_WINDOW').default('60000').asInt(), // 1 minute
  MAX_REQUEST_SIZE: env.get('MAX_REQUEST_SIZE').default('1048576').asInt(), // 1MB
  
  // Logging
  LOG_LEVEL: env.get('LOG_LEVEL').default('info').asString(),
  
  // External services
  REDIS_URL: env.get('REDIS_URL').asString(),
  SENTRY_DSN: env.get('SENTRY_DSN').asString(),
};
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: flowcrm_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Enable corepack
        run: corepack enable

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linting
        run: pnpm lint

      - name: Run type checking
        run: pnpm type-check

      - name: Run tests
        run: pnpm test:run --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/flowcrm_test
          JWT_SECRET: test-secret

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Enable corepack
        run: corepack enable

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        run: pnpm build

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add your deployment steps here
          # Example: Deploy to your cloud provider, update Kubernetes, etc.
```

### Scripts de Produção

```json
// package.json scripts
{
  "scripts": {
    "start": "node dist/server.js",
    "start:prod": "NODE_ENV=production node dist/server.js",
    "build": "tsup",
    "build:docker": "docker build -t flow-crm-api .",
    "db:migrate:prod": "NODE_ENV=production drizzle-kit push:pg",
    "health-check": "curl -f http://localhost:3333/health || exit 1"
  }
}
```

## 📚 Configuração do Biome

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.4.1/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "error",
        "useConst": "error",
        "useShorthandPropertyAssignment": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn",
        "noArrayIndexKey": "warn"
      },
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "double",
      "semicolons": "always",
      "trailingComma": "es5"
    }
  },
  "json": {
    "formatter": {
      "indentWidth": 2
    }
  }
}
```

## 🔧 Scripts Utilitários

### Seed do Banco de Dados

```typescript
// scripts/seed.ts
import { db } from '../src/database/connection';
import { users, customers, products } from '../src/database/schema';
import { PasswordService } from '../src/shared/utils/password';

async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Create admin user
    const adminPassword = await PasswordService.hash('admin123');
    const [adminUser] = await db
      .insert(users)
      .values({
        email: 'admin@flowcrm.com',
        password: adminPassword,
        name: 'Administrador',
        role: 'admin',
      })
      .returning();
    
    console.log(`✅ Admin user created: ${adminUser.email}`);
    
    // Create sample customers
    const sampleCustomers = [
      {
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-9999',
        cpf: '123.456.789-01',
        address: 'Rua das Flores, 123 - São Paulo, SP',
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '(11) 88888-8888',
        cpf: '987.654.321-02',
        address: 'Av. Paulista, 456 - São Paulo, SP',
      },
    ];
    
    const createdCustomers = await db
      .insert(customers)
      .values(sampleCustomers)
      .returning();
    
    console.log(`✅ Created ${createdCustomers.length} sample customers`);
    
    // Create sample products
    const sampleProducts = [
      {
        code: 'PRD001',
        name: 'Notebook Dell Inspiron',
        unit: 'UN',
        description: 'Notebook Dell Inspiron 15 3000, Intel Core i5, 8GB RAM, 256GB SSD',
        stock: 10,
        saleType: 'unit' as const,
        purchasePrice: '2000.00',
        salePrice: '2500.00',
        category: 'Eletrônicos',
      },
      {
        code: 'PRD002',
        name: 'Mouse Logitech MX Master',
        unit: 'UN',
        description: 'Mouse sem fio Logitech MX Master 3, precisão avançada',
        stock: 25,
        saleType: 'unit' as const,
        purchasePrice: '300.00',
        salePrice: '400.00',
        category: 'Acessórios',
      },
      {
        code: 'PRD003',
        name: 'Cabo HDMI 2.0',
        unit: 'M',
        description: 'Cabo HDMI 2.0 de alta velocidade, suporta 4K',
        stock: 100,
        saleType: 'fractional' as const,
        purchasePrice: '15.00',
        salePrice: '25.00',
        category: 'Cabos',
      },
    ];
    
    const createdProducts = await db
      .insert(products)
      .values(sampleProducts)
      .returning();
    
    console.log(`✅ Created ${createdProducts.length} sample products`);
    
    console.log('🎉 Database seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seed().then(() => process.exit(0));
}

export { seed };
```

### Health Check Script

```typescript
// scripts/health-check.ts
import http from 'http';
import { config } from '../src/config/environment';

function healthCheck(): Promise<boolean> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: config.PORT,
      path: '/health',
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  const isHealthy = await healthCheck();
  
  if (isHealthy) {
    console.log('✅ Service is healthy');
    process.exit(0);
  } else {
    console.log('❌ Service is unhealthy');
    process.exit(1);
  }
}

main();
```

## 📋 Checklist de Implementação

### Fase 1: Setup Inicial ✅
- [ ] Configuração do projeto Node.js + TypeScript
- [ ] Setup do Fastify
- [ ] Configuração do Biome
- [ ] Configuração do banco PostgreSQL
- [ ] Setup do Drizzle ORM

### Fase 2: Autenticação e Segurança ✅
- [ ] Implementação JWT
- [ ] Middleware de autenticação
- [ ] Sistema de roles e permissões
- [ ] Hash de senhas com Argon2
- [ ] Middlewares de segurança (Helmet, CORS, Rate Limiting)

### Fase 3: Modelagem e Validação ✅
- [ ] Schema do banco de dados
- [ ] Schemas Zod para validação
- [ ] Middlewares de validação
- [ ] Tratamento de erros

### Fase 4: APIs Core ✅
- [ ] Auth endpoints
- [ ] Customer endpoints
- [ ] Product endpoints
- [ ] PreSale endpoints
- [ ] Dashboard endpoints

### Fase 5: Documentação e Testes ✅
- [ ] Swagger/OpenAPI
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Coverage de pelo menos 80%

### Fase 6: Deploy e Produção ✅
- [ ] Dockerfile
- [ ] Docker Compose
- [ ] CI/CD Pipeline
- [ ] Health checks
- [ ] Monitoring e logs

## 🔗 Referências

### Documentação Oficial
- [Fastify](https://fastify.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Zod](https://zod.dev/)
- [Biome](https://biomejs.dev/)
- [Vitest](https://vitest.dev/)
- [PostgreSQL](https://www.postgresql.org/docs/)

### Guias e Melhores Práticas
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [REST API Design Guidelines](https://github.com/microsoft/api-guidelines)
- [The Twelve-Factor App](https://12factor.net/)

### Ferramentas de Desenvolvimento
- [Docker](https://docs.docker.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Pino Logger](https://github.com/pinojs/pino)
- [Argon2](https://github.com/ranisalt/node-argon2)

---

## 📝 Considerações Finais

Esta documentação fornece uma base sólida para o desenvolvimento do backend do Flow CRM. A arquitetura proposta é escalável, segura e mantível, seguindo as melhores práticas da indústria.

### Próximos Passos

1. **Implementar as funcionalidades básicas** seguindo esta documentação
2. **Configurar o ambiente de desenvolvimento** com Docker
3. **Desenvolver testes abrangentes** para garantir qualidade
4. **Configurar CI/CD** para automatizar deploys
5. **Monitorar e otimizar** a performance em produção

### Suporte

Para dúvidas ou sugestões sobre esta documentação, entre em contato com a equipe de desenvolvimento.

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2024  
**Autor**: Flow CRM Team