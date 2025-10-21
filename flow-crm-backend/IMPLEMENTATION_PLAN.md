# 📋 Plano de Implementação - Flow CRM Backend

## 🎯 Resumo Executivo

Este documento detalha o plano de implementação completo para as funcionalidades faltantes no backend do Flow CRM, baseado na análise do `backend-implementation-requirements.md` versus o estado atual do código.

**Status Atual:** ~60% implementado  
**Tempo Estimado:** 8-10 semanas  
**Prioridade:** Implementação por fases conforme criticidade

---

## ✅ O Que Já Está Implementado

### Core Entities
- ✅ Users (básico: id, email, password, name, role)
- ✅ Customers (completo com CRUD)
- ✅ Products (completo com geração automática de códigos)
- ✅ PreSales (completo com itens)

### Funcionalidades
- ✅ Sistema de autenticação (JWT, login, register, logout)
- ✅ CRUD completo para Customers, Products, PreSales
- ✅ Sistema de cálculo de preços (margin, markup, suggestions)
- ✅ Geração automática de códigos de produtos
- ✅ Cache management system
- ✅ Audit logging utilities (parcial)
- ✅ Database optimization tools
- ✅ Monitoring endpoints (cache stats, database health)
- ✅ Paginação, filtros e ordenação
- ✅ Validação de dados e error handling

---

## ❌ O Que Falta Implementar

## 🔴 FASE 1 - PRIORIDADE CRÍTICA (Semanas 1-4)

### 1.1 Sistema de Gestão de Usuários Avançado

**Objetivo:** Expandir o sistema básico de usuários para incluir permissões granulares e auditoria completa.

#### Database Schema Updates
```sql
-- Migration: add_user_management_fields.sql

ALTER TABLE users ADD COLUMN user_type VARCHAR(20) DEFAULT 'employee';
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN avatar VARCHAR(500);
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN created_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT '{}';

CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_created_by ON users(created_by);
```

#### Permissions Schema
```typescript
interface UserPermissions {
  modules: {
    products: boolean;
    customers: boolean;
    reports: boolean;
    paymentMethods: boolean;
    userManagement: boolean;
  };
  presales: {
    canCreate: boolean;
    canViewOwn: boolean;
    canViewAll: boolean;
  };
}
```

#### Arquivos a Criar/Modificar:
- `src/db/schema/users.ts` - Adicionar novos campos
- `src/services/users.service.ts` - NOVO (completo CRUD)
- `src/controllers/users.controller.ts` - NOVO
- `src/routes/users.ts` - NOVO
- `src/middlewares/permissions.middleware.ts` - NOVO
- `src/types/users.types.ts` - NOVO
- `src/schemas/users.schemas.ts` - NOVO

#### Endpoints a Implementar:
```
GET    /api/users                    - Listar usuários (admin apenas)
POST   /api/users                    - Criar usuário (admin apenas)
GET    /api/users/:id                - Buscar usuário por ID
PUT    /api/users/:id                - Atualizar usuário
DELETE /api/users/:id                - Excluir usuário (soft delete)
PUT    /api/users/:id/permissions    - Atualizar permissões
GET    /api/users/:id/audit-logs     - Logs de auditoria do usuário
```

#### Validações Necessárias:
- Email único
- Validação de força de senha
- Verificação de permissões do usuário atual
- Não permitir auto-exclusão
- Não permitir remover último admin

**Testes:** Unit tests + Integration tests (90%+ coverage)

---

### 1.2 Sistema de Audit Logs

**Objetivo:** Rastrear todas as ações importantes no sistema.

#### Database Schema
```sql
-- Migration: create_audit_logs.sql

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'view'
  resource VARCHAR(100) NOT NULL, -- 'user', 'product', 'customer', 'presale'
  resource_id UUID,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

#### Arquivos a Criar/Modificar:
- `src/db/schema/audit-logs.ts` - NOVO
- `src/services/audit-logs.service.ts` - NOVO
- `src/utils/audit-logger.ts` - Expandir existente
- `src/middlewares/audit.middleware.ts` - NOVO

#### Funcionalidades:
- Logger automático em todas as ações críticas
- Middleware para capturar IP e User Agent
- Filtros por usuário, recurso, período
- Export de logs para análise

**Testes:** Unit tests para service e middleware

---

### 1.3 Sistema de Formas de Pagamento

**Objetivo:** Criar módulo completo para gestão de métodos de pagamento.

#### Database Schema
```sql
-- Migration: create_payment_methods.sql

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_payment_methods_is_active ON payment_methods(is_active);
CREATE INDEX idx_payment_methods_code ON payment_methods(code);
```

#### Arquivos a Criar:
- `src/db/schema/payment-methods.ts` - NOVO
- `src/services/payment-methods.service.ts` - NOVO
- `src/controllers/payment-methods.controller.ts` - NOVO
- `src/routes/payment-methods.ts` - NOVO
- `src/schemas/payment-methods.schemas.ts` - NOVO
- `src/types/payment-methods.types.ts` - NOVO

#### Endpoints:
```
GET    /api/payment-methods           - Listar formas de pagamento
POST   /api/payment-methods           - Criar forma de pagamento
GET    /api/payment-methods/:id       - Buscar por ID
PUT    /api/payment-methods/:id       - Atualizar
DELETE /api/payment-methods/:id       - Soft delete
```

#### Funcionalidades Especiais:
- Usar `product-code-generator.service.ts` existente para gerar códigos
- Validação de unicidade de código
- Soft delete para manter histórico
- Cache para consultas frequentes

**Testes:** Unit + Integration tests (90%+ coverage)

---

### 1.4 Sistema de Controle de Estoque

**Objetivo:** Rastrear movimentações de estoque e alertas.

#### Database Schema
```sql
-- Migration: create_inventory_system.sql

-- Adicionar campos em products
ALTER TABLE products ADD COLUMN minimum_stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN maximum_stock INTEGER;

-- Tabela de ajustes
CREATE TABLE stock_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  product_code VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  adjustment_type VARCHAR(20) NOT NULL, -- 'add', 'remove', 'correction'
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de alertas
CREATE TABLE inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  current_stock INTEGER NOT NULL,
  minimum_stock INTEGER NOT NULL,
  severity VARCHAR(20) NOT NULL, -- 'low', 'critical'
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_user_id ON stock_adjustments(user_id);
CREATE INDEX idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX idx_inventory_alerts_is_resolved ON inventory_alerts(is_resolved);
```

#### Arquivos a Criar/Modificar:
- `src/db/schema/products.ts` - Adicionar campos de estoque
- `src/db/schema/stock-adjustments.ts` - NOVO
- `src/db/schema/inventory-alerts.ts` - NOVO
- `src/services/inventory.service.ts` - NOVO
- `src/controllers/inventory.controller.ts` - NOVO
- `src/routes/inventory.ts` - NOVO
- `src/services/products.service.ts` - Modificar para controle de estoque

#### Endpoints:
```
GET    /api/inventory/adjustments      - Listar ajustes
POST   /api/inventory/adjustments      - Criar ajuste
GET    /api/inventory/alerts           - Alertas de estoque
GET    /api/inventory/movements        - Histórico de movimentações
POST   /api/inventory/bulk-update      - Atualização em lote
GET    /api/products/:id/stock         - Consultar estoque específico
```

#### Funcionalidades:
- Validação de estoque negativo
- Criação automática de alertas quando stock < minimum_stock
- Histórico completo de movimentações
- Integração com presales (reservar estoque)
- Auditoria de todas alterações

**Testes:** Unit + Integration + E2E tests

---

## 🟡 FASE 2 - PRIORIDADE ALTA (Semanas 5-6)

### 2.1 Dashboard e Métricas

**Objetivo:** Fornecer dados para visualizações e KPIs.

#### Arquivos a Criar:
- `src/services/dashboard.service.ts` - NOVO
- `src/controllers/dashboard.controller.ts` - NOVO
- `src/routes/dashboard.ts` - NOVO

#### Endpoints:
```
GET    /api/dashboard/metrics          - Métricas principais
GET    /api/dashboard/sales-chart      - Dados para gráficos
GET    /api/dashboard/recent-activity  - Atividades recentes
GET    /api/dashboard/alerts           - Alertas do sistema
```

#### Métricas a Calcular:
- Vendas do dia (valor e trend)
- Total de produtos (valor e trend)
- Produtos com estoque baixo (valor e trend)
- Receita mensal (valor e trend)
- Gráfico de vendas (últimos 30 dias)
- Últimas 10 atividades

#### Performance:
- Cache Redis para métricas (TTL: 5 minutos)
- Query otimizada com agregações no DB
- Índices apropriados

**Testes:** Unit + Integration tests

---

### 2.2 Expansão do Sistema de Produtos

**Objetivo:** Adicionar campos adicionais e funcionalidades avançadas.

#### Database Schema Updates
```sql
-- Migration: expand_products_schema.sql

ALTER TABLE products ADD COLUMN sale_type VARCHAR(20) DEFAULT 'unit'; -- 'unit', 'fractional'
ALTER TABLE products ADD COLUMN suggested_sale_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN category VARCHAR(100);
ALTER TABLE products ADD COLUMN supplier VARCHAR(255);
ALTER TABLE products ADD COLUMN barcode VARCHAR(100);
ALTER TABLE products ADD COLUMN weight DECIMAL(10,3);
ALTER TABLE products ADD COLUMN dimensions JSONB; -- {length, width, height}

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_barcode ON products(barcode);
```

#### Arquivos a Modificar/Criar:
- `src/db/schema/products.ts` - Adicionar campos
- `src/services/products.service.ts` - Adicionar validações
- `src/controllers/products.controller.ts` - Novos endpoints
- `src/schemas/products.schemas.ts` - Atualizar validações

#### Novos Endpoints:
```
GET    /api/products/categories         - Listar categorias únicas
POST   /api/products/bulk-import        - Importação em lote (CSV/Excel)
GET    /api/products/:id/pricing        - Cálculos de preço detalhados
```

**Testes:** Unit + Integration tests

---

### 2.3 Expansão do Sistema de Pré-vendas

**Objetivo:** Adicionar campos e funcionalidades avançadas.

#### Database Schema Updates
```sql
-- Migration: expand_presales_schema.sql

ALTER TABLE presales ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id);
ALTER TABLE presales ADD COLUMN salesperson_id UUID REFERENCES users(id);
ALTER TABLE presales ADD COLUMN salesperson_name VARCHAR(255);
ALTER TABLE presales ADD COLUMN valid_until TIMESTAMP;
ALTER TABLE presales ADD COLUMN terms TEXT;
ALTER TABLE presales ADD COLUMN internal_notes TEXT;

ALTER TABLE presale_items ADD COLUMN available_stock INTEGER;
ALTER TABLE presale_items ADD COLUMN reserved_quantity DECIMAL(10,3);

CREATE INDEX idx_presales_salesperson_id ON presales(salesperson_id);
CREATE INDEX idx_presales_payment_method_id ON presales(payment_method_id);
```

#### Arquivos a Modificar/Criar:
- `src/db/schema/presales.ts` - Adicionar campos
- `src/services/presales.service.ts` - Novas funcionalidades
- `src/controllers/presales.controller.ts` - Novos endpoints

#### Novos Endpoints:
```
POST   /api/presales/:id/convert        - Converter em venda final
POST   /api/presales/:id/duplicate      - Duplicar pré-venda
GET    /api/presales/by-salesperson     - Filtrar por vendedor
PUT    /api/presales/:id/status         - Atualizar apenas status
```

#### Funcionalidades:
- Conversão de presale atualiza estoque automaticamente
- Duplicação copia todos os dados exceto status
- Filtro por vendedor com permissões
- Reserva de estoque ao criar presale

**Testes:** Unit + Integration + E2E tests

---

## 🟢 FASE 3 - PRIORIDADE MÉDIA (Semanas 7-8)

### 3.1 Sistema de Relatórios

**Objetivo:** Gerar relatórios customizados com exportação.

#### Arquivos a Criar:
- `src/services/reports.service.ts` - NOVO
- `src/controllers/reports.controller.ts` - NOVO
- `src/routes/reports.ts` - NOVO
- `src/utils/pdf-generator.ts` - NOVO
- `src/utils/excel-generator.ts` - NOVO

#### Endpoints:
```
GET    /api/reports/sales-summary       - Resumo de vendas
GET    /api/reports/payment-methods     - Vendas por forma de pagamento
GET    /api/reports/payment-methods/export - Export PDF/Excel
GET    /api/reports/inventory           - Relatório de estoque
GET    /api/reports/users-activity      - Atividade de usuários
```

#### Bibliotecas:
- `pdfkit` - Geração de PDFs
- `exceljs` - Geração de Excel
- Filtros por período, usuário, categoria, etc.

**Testes:** Unit + Integration tests

---

### 3.2 Sistema de Configurações

**Objetivo:** Armazenar configurações do sistema e dados da empresa.

#### Database Schema
```sql
-- Migration: create_system_settings.sql

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  logo_url VARCHAR(500),
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Arquivos a Criar:
- `src/db/schema/system-settings.ts` - NOVO
- `src/db/schema/company-info.ts` - NOVO
- `src/services/settings.service.ts` - NOVO
- `src/controllers/settings.controller.ts` - NOVO
- `src/routes/settings.ts` - NOVO

#### Endpoints:
```
GET    /api/settings                   - Configurações gerais
PUT    /api/settings                   - Atualizar configurações
GET    /api/settings/company           - Dados da empresa
PUT    /api/settings/company           - Atualizar dados empresa
```

**Testes:** Unit + Integration tests

---

## 📊 Cronograma Detalhado

| Fase | Funcionalidade | Duração | Prioridade |
|------|---------------|---------|------------|
| **Fase 1** | | | |
| 1.1 | Gestão de Usuários Avançada | 5 dias | 🔴 Crítica |
| 1.2 | Sistema de Audit Logs | 3 dias | 🔴 Crítica |
| 1.3 | Formas de Pagamento | 4 dias | 🔴 Crítica |
| 1.4 | Controle de Estoque | 8 dias | 🔴 Crítica |
| **Fase 2** | | | |
| 2.1 | Dashboard e Métricas | 5 dias | 🟡 Alta |
| 2.2 | Expansão de Produtos | 3 dias | 🟡 Alta |
| 2.3 | Expansão de Pré-vendas | 4 dias | 🟡 Alta |
| **Fase 3** | | | |
| 3.1 | Sistema de Relatórios | 6 dias | 🟢 Média |
| 3.2 | Sistema de Configurações | 3 dias | 🟢 Média |
| **Total** | | **41 dias** | |

**Tempo estimado:** 8-10 semanas (com buffer para testes e ajustes)

---

## 🧪 Estratégia de Testes

### Coverage Mínimo por Módulo:
- **Unit Tests:** 90%+ coverage
- **Integration Tests:** 80%+ coverage
- **E2E Tests:** Fluxos críticos principais

### Ferramentas:
- Jest (já configurado)
- Supertest (para testes de API)
- Test DB separado (já configurado)

### Prioridade de Testes:
1. 🔴 **Crítico:** Users, Payment Methods, Inventory
2. 🟡 **Alta:** Dashboard, Products, PreSales
3. 🟢 **Média:** Reports, Settings

---

## 🔒 Segurança

### Validações Necessárias:
- ✅ Validação de entrada em todos endpoints
- ✅ Sanitização de dados
- ✅ Rate limiting
- ✅ Proteção contra SQL Injection (usar prepared statements)
- ✅ Proteção contra XSS
- ✅ CORS configurado corretamente
- ✅ JWT com refresh token
- ✅ Logs de segurança

### Permissões:
- Middleware de autenticação em todas rotas protegidas
- Middleware de autorização baseado em `permissions` JSONB
- Audit logs para ações sensíveis

---

## 📦 Dependências a Adicionar

```json
{
  "dependencies": {
    "pdfkit": "^0.13.0",
    "exceljs": "^4.3.0"
  },
  "devDependencies": {
    "@types/pdfkit": "^0.12.9"
  }
}
```

---

## 🚀 Como Executar a Implementação

### Passo 1: Setup Inicial
```bash
# Instalar dependências
npm install

# Criar arquivo .env com configurações
cp .env.example .env
```

### Passo 2: Database Migrations
```bash
# Executar migrations em ordem
npm run migrate:up

# Seed inicial (usuário admin, payment methods padrão)
npm run seed
```

### Passo 3: Desenvolvimento por Fase
```bash
# Criar branch para cada fase
git checkout -b feature/fase-1-users-management

# Desenvolver, testar, commit
npm run test
npm run test:coverage

# Merge após code review
```

### Passo 4: Validação
```bash
# Rodar todos os testes
npm run test:all

# Verificar coverage
npm run test:coverage

# Build de produção
npm run build
```

---

## 📋 Checklist de Implementação

### Fase 1 - Crítica
- [ ] Database migrations criadas e testadas
- [ ] User management completo (CRUD + permissions)
- [ ] Audit logs funcionando
- [ ] Payment methods CRUD completo
- [ ] Inventory control completo
- [ ] Testes unitários ≥90%
- [ ] Testes de integração ≥80%

### Fase 2 - Alta
- [ ] Dashboard endpoints funcionando
- [ ] Métricas calculadas corretamente
- [ ] Products expandido com novos campos
- [ ] PreSales expandido e integrado
- [ ] Cache implementado
- [ ] Testes completos

### Fase 3 - Média
- [ ] Reports gerando corretamente
- [ ] Export PDF/Excel funcionando
- [ ] Settings salvando e recuperando
- [ ] Company info CRUD
- [ ] Documentação atualizada

### Final
- [ ] api.json atualizado
- [ ] README.md atualizado
- [ ] Postman collection criada
- [ ] Deploy em staging testado
- [ ] Performance testada
- [ ] Security audit realizado

---

## 📝 Observações Importantes

### Decisões de Design:
1. **User Role vs UserType:** Manter ambos para compatibilidade, mas userType será o padrão
2. **Soft Delete:** Implementar em Users, PaymentMethods para histórico
3. **Cache Strategy:** Redis para métricas, in-memory para config
4. **Audit Logs:** Assíncrono para não impactar performance

### Riscos Identificados:
- ⚠️ Complexidade do sistema de permissões pode atrasar Fase 1
- ⚠️ Integração inventory + presales requer atenção especial
- ⚠️ Reports com grandes volumes podem ter problemas de performance

### Mitigações:
- Implementar permissões de forma incremental
- Usar transactions para garantir consistência
- Implementar paginação e cache em reports

---

## 📞 Contato e Suporte

Para dúvidas sobre a implementação:
- Consultar este documento
- Verificar `backend-implementation-requirements.md`
- Verificar código existente como referência

**Última atualização:** 2025-10-10
