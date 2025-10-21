# Frontend vs Backend Separation - Flow CRM

Este documento define a separação de responsabilidades entre frontend e backend para o sistema Flow CRM.

## 🖥️ **MANTER NO FRONTEND**

### **Componentes UI e Layout**
- Todos os componentes em `src/components/` (Button, Input, Modal, Table, etc.)
- Layout completo (Header, Sidebar, Layout)
- Páginas e features (Dashboard, Products, Customers, etc.)

### **Lógica de Apresentação**
- Validações de formulário (formato de campos)
- Formatação de dados (CPF, moeda, datas)
- Estados de UI (loading, modais abertos/fechados)
- Navegação e roteamento
- Gerenciamento de estado local dos componentes

### **Utilitários de Frontend**
- `formatCurrency()`, `formatCPF()` - formatação visual
- Validações básicas de formato (`validateEmail`, `validateCPF`)
- `generateId()` - IDs temporários para UI
- Configurações de toast/notificações

### **Context e Hooks**
- `AuthContext` - gerenciamento de estado de autenticação
- Estados de loading/error para UI
- Hooks customizados para UI

---

## 🔧 **MOVER PARA O BACKEND**

### **Dados e Persistência**
```typescript
// Tudo em src/data/
- mockAuthService.ts → API de autenticação real
- mockDashboardService.ts → APIs de métricas e relatórios  
- mockPaymentMethodService.ts → CRUD de formas de pagamento
- mockUser.ts → Dados de usuário do banco
```

### **Lógica de Negócio**
```typescript
// De src/utils/
- AutoCodeService → Geração de códigos únicos no backend
- PriceCalculationService → Cálculos de preço e margem
```

### **Validações de Negócio**
- Validação de CPF existente no sistema
- Verificação de códigos únicos (produtos, pagamentos)
- Regras de negócio para preços e margens
- Validações de estoque e disponibilidade

### **Operações CRUD**
- Todas as operações de Create, Read, Update, Delete
- Gerenciamento de estoque e inventário
- Cálculos de métricas do dashboard
- Relatórios e consultas complexas

### **Autenticação e Autorização**
- Verificação de credenciais
- Geração e validação de tokens
- Controle de acesso por roles
- Sessões de usuário

### **Regras de Negócio Específicas**
- Cálculo automático de preços sugeridos
- Validação de estoque antes de vendas
- Regras de desconto e promoções
- Auditoria de alterações

---

## 📊 **DADOS QUE DEVEM VIR DO BACKEND**

### **Entidades Principais**
- Products, Customers, PreSales, PaymentMethods
- StockAdjustments, Users
- Todas as interfaces em `src/types/index.ts`

### **Métricas e Relatórios**
- DashboardMetrics, SalesData, RecentActivity
- InventoryAlerts
- Relatórios financeiros

### **Configurações**
- Configurações de margem de preço
- Parâmetros do sistema
- Configurações de usuário

---

## 🔄 **INTEGRAÇÃO FRONTEND-BACKEND**

### **APIs Necessárias**
```
POST /auth/login
GET  /dashboard/metrics
GET  /products
POST /products
PUT  /products/:id
DELETE /products/:id
GET  /customers
POST /customers
GET  /presales
POST /presales
GET  /payment-methods
GET  /inventory/alerts
POST /inventory/adjustments
```

### **O que o Frontend Fará**
- Consumir APIs REST/GraphQL
- Gerenciar cache local (React Query/SWR)
- Manter estado de UI e navegação
- Validar formatos antes de enviar
- Mostrar loading/error states

### **O que o Backend Fará**
- Validar dados de negócio
- Persistir no banco de dados
- Aplicar regras de negócio
- Gerar códigos únicos
- Calcular métricas e relatórios
- Gerenciar autenticação/autorização

---

## 📝 **Próximos Passos**

1. **Desenvolvimento do Backend**
   - Implementar APIs REST com Node.js/Express ou similar
   - Configurar banco de dados (PostgreSQL/MySQL)
   - Implementar autenticação JWT
   - Migrar lógica de negócio dos services mock

2. **Refatoração do Frontend**
   - Substituir mock services por chamadas de API
   - Implementar gerenciamento de estado global (React Query)
   - Adicionar tratamento de erros de rede
   - Implementar cache e otimizações

3. **Integração**
   - Configurar CORS no backend
   - Implementar interceptors para autenticação
   - Adicionar loading states globais
   - Testes de integração

Esta separação mantém o frontend focado na experiência do usuário enquanto o backend cuida da lógica de negócio e persistência de dados.