# Backend Implementation Requirements - Flow CRM

## 📋 Visão Geral

Este documento detalha todas as funcionalidades que precisam ser implementadas no backend para suportar completamente o frontend do Flow CRM. As funcionalidades estão organizadas por prioridade e incluem especificações técnicas detalhadas.

## 🔴 Prioridade CRÍTICA

### 1. Sistema de Gestão de Usuários

#### Endpoints Necessários:
```
GET    /api/users                    - Listar usuários (admin apenas)
POST   /api/users                    - Criar usuário (admin apenas)
GET    /api/users/{id}               - Buscar usuário por ID
PUT    /api/users/{id}               - Atualizar usuário
DELETE /api/users/{id}               - Excluir usuário (admin apenas)
PUT    /api/users/{id}/permissions   - Atualizar permissões do usuário
GET    /api/users/{id}/audit-logs    - Logs de auditoria do usuário
```

#### Modelos de Dados:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string; // hash
  userType: 'admin' | 'employee';
  permissions: UserPermissions;
  isActive: boolean;
  avatar?: string;
  lastLoginAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

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

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view';
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```

#### Funcionalidades Específicas:
- ✅ Validação de email único
- ✅ Hash de senhas com bcrypt
- ✅ Sistema de permissões granulares
- ✅ Logs de auditoria automáticos
- ✅ Controle de acesso baseado em roles
- ✅ Upload de avatar (opcional)

### 2. Sistema de Formas de Pagamento

#### Endpoints Necessários:
```
GET    /api/payment-methods          - Listar formas de pagamento
POST   /api/payment-methods          - Criar forma de pagamento
GET    /api/payment-methods/{id}     - Buscar por ID
PUT    /api/payment-methods/{id}     - Atualizar forma de pagamento
DELETE /api/payment-methods/{id}     - Excluir forma de pagamento
```

#### Modelo de Dados:
```typescript
interface PaymentMethod {
  id: string;
  code: string;        // Código único auto-gerado
  description: string; // Nome da forma de pagamento
  isActive: boolean;   // Status ativo/inativo
  createdAt: Date;
  updatedAt: Date;
}
```

#### Funcionalidades Específicas:
- ✅ Utilizar sistema de geração de códigos já existente no backend
- ✅ Validação de unicidade do código
- ✅ Soft delete para manter histórico
- ✅ Integração com pré-vendas
- ✅ Status ativo/inativo para controle

### 3. Sistema de Controle de Estoque

#### Endpoints Necessários:
```
GET    /api/inventory/adjustments     - Listar ajustes de estoque
POST   /api/inventory/adjustments     - Criar ajuste de estoque
GET    /api/inventory/alerts          - Alertas de estoque baixo
GET    /api/inventory/movements       - Histórico de movimentações
POST   /api/inventory/bulk-update     - Atualização em lote
GET    /api/products/{id}/stock       - Consultar estoque específico
```

#### Modelos de Dados:
```typescript
interface StockAdjustment {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  adjustmentType: 'add' | 'remove' | 'correction';
  quantity: number;
  reason: string;
  userId: string;        // Quem fez o ajuste
  userName: string;
  previousStock: number; // Estoque anterior
  newStock: number;      // Novo estoque
  createdAt: Date;
}

interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  severity: 'low' | 'critical';
  createdAt: Date;
}
```

#### Funcionalidades Específicas:
- ✅ Controle de estoque em tempo real
- ✅ Histórico completo de movimentações
- ✅ Alertas automáticos de estoque baixo
- ✅ Validação de estoque negativo
- ✅ Auditoria de todas as alterações
- ✅ Utilizar sistema de geração de códigos já existente no backend

## 🟡 Prioridade ALTA

### 4. Dashboard e Métricas

#### Endpoints Necessários:
```
GET    /api/dashboard/metrics         - Métricas principais do dashboard
GET    /api/dashboard/sales-chart     - Dados para gráfico de vendas
GET    /api/dashboard/recent-activity - Atividades recentes
GET    /api/dashboard/alerts          - Alertas do sistema
GET    /api/reports/sales-summary     - Resumo de vendas
```

#### Modelos de Dados:
```typescript
interface DashboardMetrics {
  salesToday: {
    value: number;
    trend: { value: number; isPositive: boolean };
  };
  totalProducts: {
    value: number;
    trend: { value: number; isPositive: boolean };
  };
  lowStockProducts: {
    value: number;
    trend: { value: number; isPositive: boolean };
  };
  monthlyRevenue: {
    value: number;
    trend: { value: number; isPositive: boolean };
  };
}

interface SalesData {
  date: string;
  sales: number;
  revenue: number;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'inventory';
  description: string;
  userId: string;
  userName: string;
  timestamp: Date;
}
```

### 5. Sistema de Cálculo de Preços e Produtos Avançados

#### Endpoints Necessários:
```
GET    /api/products/{id}/pricing           - Cálculos de preço e margem
POST   /api/products/{id}/price-calc        - Calcular preço baseado em margem
POST   /api/products/calculate-margin       - Calcular margem entre preços
POST   /api/products/suggest-price          - Sugerir preço baseado em margem alvo
GET    /api/products/categories             - Listar categorias
POST   /api/products/bulk-import            - Importação em lote
```

#### Modelos de Dados para Cálculos:
```typescript
interface PriceCalculationRequest {
  purchasePrice: number;
  marginPercentage?: number;
  targetMargin?: number;
}

interface PriceCalculationResult {
  purchasePrice: number;
  suggestedPrice: number;
  marginPercentage: number;
  finalPrice: number;
  markup: number;
}

interface PriceCalculationConfig {
  defaultMarginPercentage: number;
  minMargin: number;
  maxMargin: number;
}
```

#### Campos Adicionais no Modelo Product:
```typescript
interface Product {
  // Campos existentes...
  saleType: 'unit' | 'fractional';
  suggestedSalePrice?: number;
  category?: string;
  minimumStock?: number;
  maximumStock?: number;
  supplier?: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}
```

### 6. Expansão do Sistema de Pré-vendas

#### Campos Adicionais:
```typescript
interface PreSale {
  // Campos existentes...
  paymentMethodId: string;
  salespersonId: string;
  salespersonName: string;
  validUntil?: Date;
  terms?: string;
  internalNotes?: string;
}

interface PreSaleItem {
  // Campos existentes...
  availableStock: number;
  reservedQuantity: number;
}
```

#### Endpoints Adicionais:
```
POST   /api/presales/{id}/convert     - Converter pré-venda em venda
POST   /api/presales/{id}/duplicate   - Duplicar pré-venda
GET    /api/presales/by-salesperson   - Pré-vendas por vendedor
PUT    /api/presales/{id}/status      - Atualizar apenas status
```

## 🟢 Prioridade MÉDIA

### 7. Sistema de Notificações (LocalStorage)

#### Funcionalidades Específicas:
- ✅ Notificações em tempo real via WebSocket/SSE (opcional)
- ✅ Notificações automáticas para eventos do sistema:
  - Estoque baixo/crítico
  - Pré-vendas aprovadas/canceladas
  - Novos usuários criados
  - Alterações de permissões
- ✅ Tipos de notificação: info, warning, error, success
- ✅ Armazenamento temporário no localStorage (frontend)
- ✅ Integração com ToastService existente

**Nota:** Sistema de notificações será implementado apenas no frontend usando localStorage para persistência temporária. Backend enviará eventos via WebSocket quando necessário.

### 8. Sistema de Relatórios

#### Endpoints Necessários:
```
GET    /api/reports/payment-methods   - Relatório de vendas por forma de pagamento
GET    /api/reports/payment-methods/export - Exportar relatório (PDF/Excel)
```

#### Modelo de Dados:
```typescript
interface PaymentMethodReport {
  period: {
    startDate: string;
    endDate: string;
  };
  paymentMethods: PaymentMethodSummary[];
  totalConvertedPresales: {
    count: number;
    totalValue: number;
  };
}

interface PaymentMethodSummary {
  id: string;
  code: string;
  description: string; // Nome da finalizadora
  totalSales: number;   // Valor total
  salesCount: number;   // Quantidade de vendas
  percentage: number;   // Percentual do total
}

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  paymentMethodId?: string; // Filtro por finalizadora específica
}
```

#### Funcionalidades Específicas:
- ✅ Listagem de todas as formas de pagamento (finalizadoras)
- ✅ Resumo de vendas agrupado por forma de pagamento
- ✅ Filtros por período de data (obrigatório)
- ✅ Filtro opcional por finalizadora específica
- ✅ Exibição do total de pré-vendas convertidas no período
- ✅ Cálculo de percentuais por finalizadora
- ✅ Exportação em PDF/Excel
- ✅ Dados baseados apenas em pré-vendas convertidas (finalizadas)

### 9. Configurações do Sistema

#### Endpoints Necessários:
```
GET    /api/settings                  - Configurações gerais
PUT    /api/settings                  - Atualizar configurações
GET    /api/settings/company          - Dados da empresa
PUT    /api/settings/company          - Atualizar dados da empresa
```

## 🛠️ Especificações Técnicas

### Autenticação e Autorização
- ✅ JWT tokens com refresh token
- ✅ Middleware de autenticação
- ✅ Middleware de autorização baseado em permissões
- ✅ Rate limiting por usuário
- ✅ Logs de segurança

### Validação de Dados
- ✅ Validação de entrada com Joi ou similar
- ✅ Sanitização de dados
- ✅ Validação de tipos TypeScript
- ✅ Mensagens de erro padronizadas

### Banco de Dados
- ✅ Migrations para todas as novas tabelas
- ✅ Índices otimizados
- ✅ Constraints de integridade referencial
- ✅ Soft deletes onde necessário
- ✅ Auditoria automática (created_at, updated_at, created_by)

### Performance
- ✅ Cache Redis para consultas frequentes
- ✅ Paginação em todas as listagens
- ✅ Compressão de respostas
- ✅ Otimização de queries N+1

### Monitoramento
- ✅ Logs estruturados
- ✅ Métricas de performance
- ✅ Health checks
- ✅ Alertas de erro

## 📅 Cronograma Sugerido

### Semana 1-2: Prioridade Crítica
- [ ] Sistema de gestão de usuários
- [ ] Sistema de permissões
- [ ] Formas de pagamento

### Semana 3-4: Prioridade Crítica (continuação)
- [ ] Sistema de controle de estoque
- [ ] Logs de auditoria
- [ ] Testes unitários e integração

### Semana 5-6: Prioridade Alta
- [ ] Dashboard e métricas
- [ ] Sistema de cálculo de preços
- [ ] Funcionalidades avançadas de produtos
- [ ] Expansão de pré-vendas

### Semana 7-8: Prioridade Média
- [ ] Sistema de notificações (WebSocket/SSE)
- [ ] Sistema de relatórios
- [ ] Configurações do sistema

### Semana 9-10: Prioridade Baixa + Refinamentos
- [ ] Sistema de backup
- [ ] API de integração
- [ ] Otimizações de performance
- [ ] Documentação completa

## 🧪 Testes Necessários

### Testes Unitários (Marcar como opcional)
- [ ] Todos os services
- [ ] Todos os controllers
- [ ] Validações de dados
- [ ] Cálculos de negócio

### Testes de Integração
- [ ] Fluxos completos de CRUD
- [ ] Autenticação e autorização
- [ ] Integridade referencial
- [ ] Performance de queries

### Testes E2E
- [ ] Fluxos críticos do usuário
- [ ] Cenários de erro
- [ ] Limites do sistema

## 📚 Documentação Necessária

- [ ] API Documentation (OpenAPI/Swagger)
- [ ] Guia de instalação e configuração
- [ ] Guia de desenvolvimento
- [ ] Documentação de arquitetura
- [ ] Guia de troubleshooting

## 🔒 Considerações de Segurança

- [ ] Validação de entrada rigorosa
- [ ] Proteção contra SQL injection
- [ ] Proteção contra XSS
- [ ] Rate limiting
- [ ] Logs de segurança
- [ ] Criptografia de dados sensíveis
- [ ] Backup seguro
- [ ] Política de senhas
- [ ] Sessões seguras

---

**Nota:** Este documento deve ser atualizado conforme o progresso da implementação e novos requisitos identificados durante o desenvolvimento.
#
# 📝 **Observações Importantes**

### Códigos Auto-gerados
- O backend já possui sistema de geração de códigos implementado
- Não é necessário replicar a lógica do frontend
- Utilizar o sistema existente para todos os novos módulos (Payment Methods, etc.)

### Sistema de Notificações
- Implementação simplificada usando localStorage no frontend
- Backend enviará eventos via WebSocket/SSE quando necessário
- Não requer persistência de dados no backend inicialmente
- Integração com ToastService já existente no frontend

### Cálculo de Preços
- Sistema crítico que deve ser mantido
- Frontend já implementa toda a lógica de interface
- Backend deve fornecer APIs para cálculos server-side quando necessário